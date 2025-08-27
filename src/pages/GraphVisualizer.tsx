import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { Home, Play, Square, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface Node {
  id: string;
  x: number;
  y: number;
  visited: boolean;
  current: boolean;
  inQueue: boolean;
  distance?: number;
}

interface Edge {
  from: string;
  to: string;
  weight?: number;
  highlighted: boolean;
}

interface Graph {
  [key: string]: { [key: string]: number };
}

type Algorithm = 'bfs' | 'dfs' | 'dijkstra' | 'bellman-ford';
type InputMode = 'adjacency-list' | 'adjacency-matrix' | 'random';

const GraphVisualizer = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [graph, setGraph] = useState<Graph>({});
  const [algorithm, setAlgorithm] = useState<Algorithm>('bfs');
  const [inputMode, setInputMode] = useState<InputMode>('adjacency-list');
  const [inputText, setInputText] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [startNode, setStartNode] = useState('');
  const [isDirected, setIsDirected] = useState(false);
  const [isWeighted, setIsWeighted] = useState(false);
  const [isAcyclic, setIsAcyclic] = useState(false);
  const [nodeCount, setNodeCount] = useState([6]);
  const [speed, setSpeed] = useState([5]);
  const [traversalOrder, setTraversalOrder] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<NodeJS.Timeout[]>([]);
  const isRunningRef = useRef(false);
  const navigate = useNavigate();

  const sleep = () => {
    const delay = 1100 - speed[0] * 100;
    return new Promise(resolve => {
      const timeout = setTimeout(resolve, delay);
      animationRef.current.push(timeout);
    });
  };

  const stopVisualization = () => {
    animationRef.current.forEach(timeout => clearTimeout(timeout));
    animationRef.current = [];
    setIsRunning(false);
    isRunningRef.current = false;
    // Reset all visual states
    setNodes(prev => prev.map(node => ({ ...node, visited: false, current: false, inQueue: false })));
    setEdges(prev => prev.map(edge => ({ ...edge, highlighted: false })));
    setTraversalOrder([]);
  };

  const parseAdjacencyList = (input: string): Graph => {
    const lines = input.trim().split('\n');
    const graph: Graph = {};
    
    lines.forEach(line => {
      const parts = line.trim().split(':');
      if (parts.length !== 2) throw new Error('Invalid format');
      
      const node = parts[0].trim();
      const neighbors = parts[1].trim();
      
      if (!graph[node]) graph[node] = {};
      
      if (neighbors) {
        const neighborList = neighbors.split(',');
        neighborList.forEach(neighbor => {
          const trimmed = neighbor.trim();
          if (isWeighted && trimmed.includes('(')) {
            const match = trimmed.match(/(\w+)\((\d+)\)/);
            if (match) {
              graph[node][match[1]] = parseInt(match[2]);
            }
          } else {
            graph[node][trimmed] = 1;
          }
        });
      }
    });
    
    return graph;
  };

  const parseAdjacencyMatrix = (input: string): Graph => {
    const lines = input.trim().split('\n');
    const nodeLabels = lines[0].split(',').map(s => s.trim());
    const graph: Graph = {};
    
    // Initialize graph
    nodeLabels.forEach(label => {
      graph[label] = {};
    });
    
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(s => parseInt(s.trim()));
      const fromNode = nodeLabels[i - 1];
      
      row.forEach((weight, j) => {
        if (weight > 0) {
          const toNode = nodeLabels[j];
          graph[fromNode][toNode] = isWeighted ? weight : 1;
        }
      });
    }
    
    return graph;
  };

  const generateRandomGraph = (): Graph => {
    const count = nodeCount[0];
    const nodeLabels = Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
    const graph: Graph = {};
    
    // Initialize nodes
    nodeLabels.forEach(label => {
      graph[label] = {};
    });
    
    if (isAcyclic && isDirected) {
      // For acyclic directed graphs (DAG), only allow edges from lower to higher index
      for (let i = 0; i < nodeLabels.length; i++) {
        const from = nodeLabels[i];
        // Connect to a few random higher-index nodes
        const possibleTargets = nodeLabels.slice(i + 1);
        const connectionCount = Math.min(Math.floor(Math.random() * 3) + 1, possibleTargets.length);
        
        for (let j = 0; j < connectionCount; j++) {
          if (possibleTargets.length > 0) {
            const randomIndex = Math.floor(Math.random() * possibleTargets.length);
            const to = possibleTargets.splice(randomIndex, 1)[0];
            const weight = isWeighted ? Math.floor(Math.random() * 10) + 1 : 1;
            graph[from][to] = weight;
          }
        }
      }
    } else {
      // For cyclic graphs or undirected graphs, use the original algorithm
      // First, create a connected graph by connecting each node to the next (ensuring connectivity)
      for (let i = 0; i < nodeLabels.length; i++) {
        const from = nodeLabels[i];
        const to = nodeLabels[(i + 1) % nodeLabels.length];
        const weight = isWeighted ? Math.floor(Math.random() * 5) + 1 : 1;
        
        graph[from][to] = weight;
        if (!isDirected) {
          graph[to][from] = weight;
        }
      }
      
      // Add additional random edges for complexity
      const maxAdditionalEdges = Math.floor(count * (count - 1) / 4); // 25% of possible edges
      const additionalEdges = Math.floor(Math.random() * maxAdditionalEdges) + count;
      
      for (let i = 0; i < additionalEdges; i++) {
        const from = nodeLabels[Math.floor(Math.random() * nodeLabels.length)];
        const availableTargets = nodeLabels.filter(to => 
          to !== from && !graph[from][to] // Don't create duplicate edges
        );
        
        if (availableTargets.length > 0) {
          const to = availableTargets[Math.floor(Math.random() * availableTargets.length)];
          const weight = isWeighted ? Math.floor(Math.random() * 10) + 1 : 1;
          
          graph[from][to] = weight;
          if (!isDirected) {
            graph[to][from] = weight;
          }
        }
      }
    }
    
    return graph;
  };

  const createVisualization = (graphData: Graph) => {
    const nodeIds = Object.keys(graphData);
    const centerX = 400;
    const centerY = 300;
    const radius = 200;
    
    // Create nodes in circular layout
    const newNodes: Node[] = nodeIds.map((id, index) => {
      const angle = (index * 2 * Math.PI) / nodeIds.length;
      return {
        id,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        visited: false,
        current: false,
        inQueue: false,
        distance: algorithm === 'dijkstra' || algorithm === 'bellman-ford' ? (id === startNode ? 0 : Infinity) : undefined
      };
    });
    
    // Create edges
    const newEdges: Edge[] = [];
    Object.entries(graphData).forEach(([from, neighbors]) => {
      Object.entries(neighbors).forEach(([to, weight]) => {
        newEdges.push({
          from,
          to,
          weight: isWeighted ? weight : undefined,
          highlighted: false
        });
      });
    });
    
    setNodes(newNodes);
    setEdges(newEdges);
  };

  const generateGraph = () => {
    try {
      let graphData: Graph;
      
      switch (inputMode) {
        case 'adjacency-list':
          graphData = parseAdjacencyList(inputText);
          break;
        case 'adjacency-matrix':
          graphData = parseAdjacencyMatrix(inputText);
          break;
        case 'random':
          graphData = generateRandomGraph();
          break;
        default:
          throw new Error('Invalid input mode');
      }
      
      setGraph(graphData);
      createVisualization(graphData);
      
      if (Object.keys(graphData).length > 0) {
        setStartNode(Object.keys(graphData)[0]);
      }
      
      toast.success("Graph generated successfully!");
    } catch (error) {
      toast.error("Failed to parse graph. Please check your input format.");
      console.error(error);
    }
  };

  // BFS Algorithm
  const bfs = async (startNodeId: string) => {
    console.log("BFS starting with node:", startNodeId);
    console.log("Current graph:", graph);
    
    const queue: string[] = [startNodeId];
    const visited = new Set<string>();
    const order: string[] = [];
    
    while (queue.length > 0 && isRunningRef.current) {
      console.log("BFS loop, queue:", queue, "visited:", Array.from(visited));
      
      const current = queue.shift()!;
      
      if (visited.has(current)) continue;
      
      visited.add(current);
      order.push(current);
      
      console.log("Visiting node:", current);
      
      // Update traversal order
      setTraversalOrder([...order]);
      
      // Mark current node as current
      setNodes(prev => prev.map(node => ({
        ...node,
        current: node.id === current,
        visited: visited.has(node.id)
      })));
      
      await sleep();
      
      // Add neighbors to queue
      if (graph[current]) {
        console.log("Neighbors of", current, ":", Object.keys(graph[current]));
        for (const neighbor of Object.keys(graph[current])) {
          if (!visited.has(neighbor) && !queue.includes(neighbor)) {
            queue.push(neighbor);
            console.log("Added to queue:", neighbor);
            
            // Mark as in queue
            setNodes(prev => prev.map(node => ({
              ...node,
              inQueue: node.id === neighbor || node.inQueue
            })));
            
            // Highlight edge
            setEdges(prev => prev.map(edge => ({
              ...edge,
              highlighted: (edge.from === current && edge.to === neighbor) ||
                          (!isDirected && edge.from === neighbor && edge.to === current)
            })));
            
            await sleep();
          }
        }
      }
      
      // Mark node as visited, clear current
      setNodes(prev => prev.map(node => ({
        ...node,
        visited: visited.has(node.id),
        current: false,
        inQueue: queue.includes(node.id)
      })));
      
      // Clear edge highlighting
      setEdges(prev => prev.map(edge => ({ ...edge, highlighted: false })));
    }
    
    console.log("BFS completed. Final order:", order);
  };

  // DFS Algorithm
  const dfs = async (current: string, visited: Set<string>, order: string[]) => {
    console.log("DFS visiting:", current, "visited so far:", Array.from(visited));
    console.log("Current isRunning:", isRunning);
    
    if (!isRunningRef.current || visited.has(current)) {
      console.log("Stopping DFS - isRunning:", isRunningRef.current, "already visited:", visited.has(current));
      return;
    }
    
    visited.add(current);
    order.push(current);
    
    console.log("Added to order:", current, "new order:", [...order]);
    
    // Update traversal order
    setTraversalOrder([...order]);
    
    // Mark current node
    setNodes(prev => prev.map(node => ({
      ...node,
      current: node.id === current,
      visited: visited.has(node.id)
    })));
    
    await sleep();
    
    // Visit neighbors
    if (graph[current]) {
      console.log("Exploring neighbors of", current, ":", Object.keys(graph[current]));
      for (const neighbor of Object.keys(graph[current])) {
        if (!visited.has(neighbor) && isRunningRef.current) {
          console.log("Will visit neighbor:", neighbor);
          
          // Highlight edge
          setEdges(prev => prev.map(edge => ({
            ...edge,
            highlighted: (edge.from === current && edge.to === neighbor) ||
                        (!isDirected && edge.from === neighbor && edge.to === current)
          })));
          
          await sleep();
          await dfs(neighbor, visited, order);
          
          // Clear edge highlighting after recursion
          setEdges(prev => prev.map(edge => ({ ...edge, highlighted: false })));
        }
      }
    }
    
    // Unmark current
    setNodes(prev => prev.map(node => ({
      ...node,
      current: false
    })));
    
    console.log("DFS completed for node:", current);
  };

  // Dijkstra's Algorithm
  const dijkstra = async (startNodeId: string) => {
    const distances: { [key: string]: number } = {};
    const visited = new Set<string>();
    const unvisited = new Set<string>();
    const order: string[] = [];
    
    // Initialize distances
    Object.keys(graph).forEach(nodeId => {
      distances[nodeId] = nodeId === startNodeId ? 0 : Infinity;
      unvisited.add(nodeId);
    });
    
    while (unvisited.size > 0 && isRunningRef.current) {
      if (!isRunningRef.current) return;
      
      // Find unvisited node with minimum distance
      let current = '';
      let minDistance = Infinity;
      unvisited.forEach(nodeId => {
        if (distances[nodeId] < minDistance) {
          minDistance = distances[nodeId];
          current = nodeId;
        }
      });
      
      if (current === '' || distances[current] === Infinity) break;
      
      unvisited.delete(current);
      visited.add(current);
      order.push(current);
      
      // Update traversal order
      setTraversalOrder([...order]);
      
      // Mark current node
      setNodes(prev => prev.map(node => ({
        ...node,
        current: node.id === current,
        visited: visited.has(node.id),
        distance: distances[node.id] === Infinity ? undefined : distances[node.id]
      })));
      
      await sleep();
      
      // Update distances to neighbors
      if (graph[current]) {
        for (const neighbor of Object.keys(graph[current])) {
          if (!visited.has(neighbor)) {
            const newDistance = distances[current] + graph[current][neighbor];
            
            if (newDistance < distances[neighbor]) {
              distances[neighbor] = newDistance;
              
              // Highlight edge
              setEdges(prev => prev.map(edge => ({
                ...edge,
                highlighted: (edge.from === current && edge.to === neighbor) ||
                            (!isDirected && edge.from === neighbor && edge.to === current)
              })));
              
              // Update distances display
              setNodes(prev => prev.map(node => ({
                ...node,
                distance: distances[node.id] === Infinity ? undefined : distances[node.id]
              })));
              
              await sleep();
            }
          }
        }
      }
      
      // Clear current marker and edge highlighting
      setNodes(prev => prev.map(node => ({
        ...node,
        current: false,
        distance: distances[node.id] === Infinity ? undefined : distances[node.id]
      })));
      setEdges(prev => prev.map(edge => ({ ...edge, highlighted: false })));
    }
  };

  // Bellman-Ford Algorithm
  const bellmanFord = async (startNodeId: string) => {
    const distances: { [key: string]: number } = {};
    const nodeIds = Object.keys(graph);
    const order: string[] = [];
    
    // Initialize distances
    nodeIds.forEach(nodeId => {
      distances[nodeId] = nodeId === startNodeId ? 0 : Infinity;
    });
    
    // Update distances for all nodes
    setNodes(prev => prev.map(node => ({
      ...node,
      distance: distances[node.id] === Infinity ? undefined : distances[node.id]
    })));
    
    // Relax edges V-1 times
    for (let i = 0; i < nodeIds.length - 1 && isRunningRef.current; i++) {
      let hasUpdate = false;
      
      for (const from of nodeIds) {
        if (!isRunningRef.current) return;
        
        if (!order.includes(from)) {
          order.push(from);
          setTraversalOrder([...order]);
        }
        
        // Highlight current node
        setNodes(prev => prev.map(node => ({
          ...node,
          current: node.id === from,
          distance: distances[node.id] === Infinity ? undefined : distances[node.id],
          visited: distances[node.id] !== Infinity
        })));
        
        await sleep();
        
        if (graph[from] && distances[from] !== Infinity) {
          for (const to of Object.keys(graph[from])) {
            const weight = graph[from][to];
            const newDistance = distances[from] + weight;
            
            if (newDistance < distances[to]) {
              distances[to] = newDistance;
              hasUpdate = true;
              
              // Highlight edge
              setEdges(prev => prev.map(edge => ({
                ...edge,
                highlighted: (edge.from === from && edge.to === to) ||
                            (!isDirected && edge.from === to && edge.to === from)
              })));
              
              // Update node distances
              setNodes(prev => prev.map(node => ({
                ...node,
                distance: distances[node.id] === Infinity ? undefined : distances[node.id],
                visited: distances[node.id] !== Infinity
              })));
              
              await sleep();
            }
          }
        }
        
        // Clear current and edge highlighting
        setNodes(prev => prev.map(node => ({
          ...node,
          current: false,
          distance: distances[node.id] === Infinity ? undefined : distances[node.id]
        })));
        setEdges(prev => prev.map(edge => ({ ...edge, highlighted: false })));
      }
      
      if (!hasUpdate) break; // Early termination if no updates
    }
    
    // Check for negative cycles
    for (const from of nodeIds) {
      if (!isRunningRef.current) return;
      
      if (graph[from] && distances[from] !== Infinity) {
        for (const to of Object.keys(graph[from])) {
          const weight = graph[from][to];
          const newDistance = distances[from] + weight;
          
          if (newDistance < distances[to]) {
            toast.error("Negative cycle detected!");
            return;
          }
        }
      }
    }
  };

  const startVisualization = async () => {
    console.log("Starting visualization with:", { algorithm, startNode, graphKeys: Object.keys(graph) });
    
    if (!startNode || Object.keys(graph).length === 0) {
      toast.error("Please generate a graph and select a start node first!");
      return;
    }
    
    isRunningRef.current = true;
    setIsRunning(true);
    setTraversalOrder([]);
    
    // Reset visualization state
    setNodes(prev => prev.map(node => ({ 
      ...node, 
      visited: false, 
      current: false, 
      inQueue: false,
      distance: algorithm === 'dijkstra' || algorithm === 'bellman-ford' ? (node.id === startNode ? 0 : Infinity) : undefined
    })));
    setEdges(prev => prev.map(edge => ({ ...edge, highlighted: false })));

    console.log("About to start algorithm:", algorithm);
    
    try {
      switch (algorithm) {
        case 'bfs':
          console.log("Starting BFS");
          await bfs(startNode);
          break;
        case 'dfs':
          console.log("Starting DFS"); 
          await dfs(startNode, new Set(), []);
          break;
        case 'dijkstra':
          console.log("Starting Dijkstra");
          await dijkstra(startNode);
          break;
        case 'bellman-ford':
          console.log("Starting Bellman-Ford");
          await bellmanFord(startNode);
          break;
      }
      
      if (isRunningRef.current) {
        toast.success("Algorithm visualization completed!");
      }
    } catch (error) {
      console.error("Visualization error:", error);
    } finally {
      setIsRunning(false);
      isRunningRef.current = false;
    }
  };

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw edges
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      
      if (fromNode && toNode) {
        ctx.strokeStyle = edge.highlighted ? '#ec4899' : '#64748b';
        ctx.lineWidth = edge.highlighted ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
        
        // Draw arrow for directed graphs
        if (isDirected) {
          const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
          const arrowLength = 15;
          const arrowX = toNode.x - 25 * Math.cos(angle);
          const arrowY = toNode.y - 25 * Math.sin(angle);
          
          ctx.beginPath();
          ctx.moveTo(arrowX, arrowY);
          ctx.lineTo(arrowX - arrowLength * Math.cos(angle - Math.PI / 6), arrowY - arrowLength * Math.sin(angle - Math.PI / 6));
          ctx.moveTo(arrowX, arrowY);
          ctx.lineTo(arrowX - arrowLength * Math.cos(angle + Math.PI / 6), arrowY - arrowLength * Math.sin(angle + Math.PI / 6));
          ctx.stroke();
        }
        
        // Draw weight
        if (isWeighted && edge.weight) {
          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(midX - 10, midY - 10, 20, 20);
          ctx.fillStyle = '#000000';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(edge.weight.toString(), midX, midY + 4);
        }
      }
    });
    
    // Draw nodes
    nodes.forEach(node => {
      let fillColor = '#3b82f6'; // default blue
      if (node.current) fillColor = '#ec4899'; // pink for current
      else if (node.visited) fillColor = '#10b981'; // green for visited
      else if (node.inQueue) fillColor = '#f59e0b'; // yellow for in queue
      
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 25, 0, 2 * Math.PI);
      ctx.fill();
      
      // Node border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Node label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(node.id, node.x, node.y + 5);
      
      // Distance for algorithms that calculate distances
      if ((algorithm === 'dijkstra' || algorithm === 'bellman-ford') && node.distance !== undefined && node.distance !== Infinity) {
        ctx.fillStyle = '#000000';
        ctx.font = '10px Arial';
        ctx.fillText(`d:${node.distance}`, node.x, node.y - 35);
      }
    });
  }, [nodes, edges, isDirected, isWeighted, algorithm]);

  const exampleInputs = {
    'adjacency-list': 'A: B,C\nB: A,D,E\nC: A,F\nD: B\nE: B,F\nF: C,E',
    'adjacency-matrix': 'A,B,C,D\n0,1,1,0\n1,0,1,1\n1,1,0,1\n0,1,1,0',
    'random': 'Click "Generate Random" to create a random graph'
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="bg-animated"></div>
      
      <div className="relative z-10 min-h-screen p-4">
        <div className="glass-container max-w-7xl mx-auto p-6 animate-slide-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="title-section">🕸️ Graph Visualizer</h1>
            <Button onClick={() => navigate('/')} className="btn-glass">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visualization Canvas */}
            <div className="lg:col-span-2">
              <div className="glass-container p-6 mb-6">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="w-full h-auto bg-gray-900 rounded-lg"
                />
              </div>
              
              {/* Control Buttons */}
              <div className="flex gap-2 justify-center mb-4">
                <Button 
                  onClick={startVisualization} 
                  disabled={isRunning || nodes.length === 0}
                  className="btn-glass btn-primary"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start {algorithm.toUpperCase()}
                </Button>
                
                <Button 
                  onClick={stopVisualization} 
                  disabled={!isRunning}
                  className="btn-glass"
                  variant="destructive"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </div>

              {/* Traversal Order Output */}
              <div className="glass-container p-4">
                <h4 className="text-sm font-medium mb-2">Traversal Order:</h4>
                <div className="min-h-[40px] p-3 bg-muted rounded text-sm font-mono border">
                  {traversalOrder.length > 0 ? traversalOrder.join(' → ') : 'No traversal yet'}
                </div>
              </div>
            </div>

            {/* Control Panel */}
            <div className="space-y-4">
              {/* Settings */}
              <div className="glass-container p-6">
                <h3 className="text-lg font-semibold mb-4">Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Algorithm</label>
                    <Select value={algorithm} onValueChange={(value: Algorithm) => setAlgorithm(value)} disabled={isRunning}>
                      <SelectTrigger className="input-glass">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bfs">Breadth-First Search</SelectItem>
                        <SelectItem value="dfs">Depth-First Search</SelectItem>
                        <SelectItem value="dijkstra">Dijkstra's Algorithm</SelectItem>
                        <SelectItem value="bellman-ford">Bellman-Ford Algorithm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Input Mode</label>
                    <Select value={inputMode} onValueChange={(value: InputMode) => setInputMode(value)} disabled={isRunning}>
                      <SelectTrigger className="input-glass">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="adjacency-list">Adjacency List</SelectItem>
                        <SelectItem value="adjacency-matrix">Adjacency Matrix</SelectItem>
                        <SelectItem value="random">Random Graph</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isDirected}
                        onChange={(e) => setIsDirected(e.target.checked)}
                        disabled={isRunning}
                        className="rounded"
                      />
                      <span className="text-sm">Directed</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isWeighted}
                        onChange={(e) => setIsWeighted(e.target.checked)}
                        disabled={isRunning}
                        className="rounded"
                      />
                      <span className="text-sm">Weighted</span>
                    </label>
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isAcyclic}
                        onChange={(e) => setIsAcyclic(e.target.checked)}
                        disabled={isRunning || !isDirected}
                        className="rounded"
                      />
                      <span className="text-sm">Acyclic (DAG)</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Nodes: {nodeCount[0]}</label>
                    <Slider
                      value={nodeCount}
                      onValueChange={setNodeCount}
                      max={12}
                      min={3}
                      step={1}
                      disabled={isRunning}
                      className="mb-4"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Speed: {speed[0]}</label>
                    <Slider
                      value={speed}
                      onValueChange={setSpeed}
                      max={10}
                      min={1}
                      step={1}
                      disabled={isRunning}
                    />
                  </div>

                  {nodes.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Start Node</label>
                      <Select value={startNode} onValueChange={setStartNode} disabled={isRunning}>
                        <SelectTrigger className="input-glass">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(graph).map(nodeId => (
                            <SelectItem key={nodeId} value={nodeId}>{nodeId}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Input */}
              <div className="glass-container p-6">
                <h3 className="text-lg font-semibold mb-4">Graph Input</h3>
                
                {inputMode !== 'random' && (
                  <div className="mb-4">
                    <Textarea
                      placeholder={exampleInputs[inputMode]}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      disabled={isRunning}
                      className="input-glass min-h-[120px] font-mono text-sm"
                    />
                  </div>
                )}

                {inputMode === 'random' && (
                  <div className="mb-4 p-4 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/30">
                    <p className="text-sm text-muted-foreground text-center">
                      Random graph will be generated with {nodeCount[0]} nodes
                    </p>
                    <p className="text-xs text-muted-foreground/80 text-center mt-1">
                      {isDirected ? 'Directed' : 'Undirected'} • {isWeighted ? 'Weighted' : 'Unweighted'} • {isAcyclic && isDirected ? 'Acyclic (DAG)' : 'Cyclic'}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Button 
                    onClick={generateGraph} 
                    disabled={isRunning}
                    className="btn-glass w-full bg-primary/10 hover:bg-primary/20 border-primary/30"
                    size="lg"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {inputMode === 'random' ? 'Generate Random Graph' : 'Generate Graph'}
                  </Button>
                </div>

                {/* Algorithm Explanation */}
                <div className="mt-6 p-4 bg-glass-bg rounded-lg border border-glass-border">
                  <h4 className="text-sm font-medium mb-2">Algorithm Explanation:</h4>
                  <div className="text-xs space-y-2">
                    {algorithm === 'bfs' && (
                      <div>
                        <p className="font-medium text-accent-cyan">Breadth-First Search</p>
                        <p>Explores nodes level by level using a queue. Visits all neighbors before going deeper.</p>
                        <p className="text-accent-pink">Time: O(V + E) | Space: O(V)</p>
                      </div>
                    )}
                    {algorithm === 'dfs' && (
                      <div>
                        <p className="font-medium text-accent-cyan">Depth-First Search</p>
                        <p>Explores as far as possible along each branch before backtracking. Uses recursion/stack.</p>
                        <p className="text-accent-pink">Time: O(V + E) | Space: O(V)</p>
                      </div>
                    )}
                    {algorithm === 'dijkstra' && (
                      <div>
                        <p className="font-medium text-accent-cyan">Dijkstra's Algorithm</p>
                        <p>Finds shortest paths from source to all other nodes in weighted graphs with non-negative edges.</p>
                        <p className="text-accent-pink">Time: O((V + E) log V) | Space: O(V)</p>
                      </div>
                    )}
                    {algorithm === 'bellman-ford' && (
                      <div>
                        <p className="font-medium text-accent-cyan">Bellman-Ford Algorithm</p>
                        <p>Finds shortest paths from source, works with negative edges and detects negative cycles.</p>
                        <p className="text-accent-pink">Time: O(V × E) | Space: O(V)</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-4 p-4 bg-glass-bg rounded-lg border border-glass-border">
                  <h4 className="text-sm font-medium mb-2">Legend:</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-primary-blue rounded-full"></div>
                      <span>Unvisited</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-accent-pink rounded-full"></div>
                      <span>Current</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span>Visited</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                      <span>In Queue</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphVisualizer;
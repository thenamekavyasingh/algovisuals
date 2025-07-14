import { renderGraph } from './utils/graphRenderer.js';
import { bfs } from './algorithms/bfs.js';
import { dfs } from './algorithms/dfs.js';
import { topologicalSort } from './algorithms/topologicalSort.js';
import { dijkstra } from './algorithms/dijkstra.js';
import { bellmanFord } from './algorithms/bellmanFord.js';

const canvas = document.getElementById('graph-canvas');
const canvasWidth = canvas.offsetWidth;
const canvasHeight = canvas.offsetHeight;
const inputBox = document.getElementById('graph-input');
const inputType = document.getElementById('input-mode');
const algoSelect = document.getElementById('algo-select');
const graphType = document.getElementById('graph-type');
const weightedToggle = document.getElementById('weighted-toggle');
const speedSlider = document.getElementById('speed-slider');

let graphData = {};
let nodeCount = 0;
let isDirected = false;
let isWeighted = false;

document.getElementById('generate-graph').addEventListener('click', () => {
  const input = inputBox.value.trim();
  const type = inputType.value;
  isDirected = graphType.value === 'directed';
  isWeighted = weightedToggle.checked;

  try {
    graphData = (type === 'adjacency-matrix')
      ? parseMatrix(input)
      : parseInput(input, type);

    console.log("Parsed Graph:", graphData);
    console.log("isDirected:", isDirected, "isWeighted:", isWeighted);

    nodeCount = Object.keys(graphData).length;
    renderGraph(canvas, graphData, isDirected, isWeighted);
  } catch (err) {
    alert("Invalid input format");
    console.error(err);
  }
});

document.getElementById('random-graph').addEventListener('click', () => {
  const nodeCount = 5; // or allow dynamic later
  isDirected = graphType.value === 'directed';
  isWeighted = weightedToggle.checked;

  const randomGraph = generateRandomGraph(nodeCount, isDirected, isWeighted);

  // Convert back to text format to show in textarea
  const inputText = graphToText(randomGraph);
  inputBox.value = inputText;

  // Parse + render it
  graphData = randomGraph;
  renderGraph(canvas, graphData, isDirected, isWeighted);
});

document.getElementById('start-visualization').addEventListener('click', async () => {
  const algo = algoSelect.value;
  const speed = 1100 - speedSlider.value * 100;

  disableControls(true);

  if (algo === 'bfs') await bfs(graphData, isDirected, isWeighted, speed);
  else if (algo === 'dfs') await dfs(graphData, isDirected, isWeighted, speed);
  else if (algo === 'topo') await topologicalSort(graphData, isDirected, speed);
  else if (algo === 'dijkstra') await dijkstra(graphData, isDirected, speed);
  else if (algo === 'bellman-ford') await bellmanFord(graphData, isDirected, speed);

  disableControls(false);
});

// ===== Helpers =====

function disableControls(state) {
  document.querySelectorAll('button, select, input, textarea').forEach(el => {
    el.disabled = state;
  });
}

// Expected input format: "0:1,2 1:2 2:3"
function parseInput(text, type) {
  const graph = {};
  const lines = text.split(/\n| /).filter(l => l.includes(":"));

  for (let line of lines) {
    const [from, rest] = line.split(":");
    const edges = rest.trim() === "" ? [] : rest.split(",").map(edge => {
      const parts = edge.split("-");
      const to = parts[0];
      const weight = parts[1] ? parseInt(parts[1]) : 1;
      return isWeighted ? { node: to, weight } : to;
    });

    graph[from] = edges;

    // ✅ Only add to-node if not already defined
    edges.forEach(edge => {
      const to = typeof edge === 'string' ? edge : edge.node;
      if (!(to in graph)) graph[to] = [];
    });
  }

  return graph;
}
function parseMatrix(text) {
  const rows = text.trim().split('\n');
  const graph = {};

  for (let i = 0; i < rows.length; i++) {
    const values = rows[i].trim().split(/\s+/);
    graph[i.toString()] = [];

    for (let j = 0; j < values.length; j++) {
      const cell = parseInt(values[j]);
      if (cell !== 0) {
        // If weighted, treat value as weight
        const edge = isWeighted
          ? { node: j.toString(), weight: cell }
          : j.toString();

        graph[i.toString()].push(edge);

        // Ensure 'to' node exists in graph
        if (!(j.toString() in graph)) {
          graph[j.toString()] = [];
        }
      }
    }
  }

  return graph;
}
function generateRandomGraph(n = 5, directed = false, weighted = false) {
  const graph = {};

  for (let i = 0; i < n; i++) {
    graph[i.toString()] = [];
  }

  for (let i = 0; i < n; i++) {
    const edgeCount = Math.floor(Math.random() * (n - 1)) + 1;

    for (let j = 0; j < edgeCount; j++) {
      const to = Math.floor(Math.random() * n);
      if (to !== i && !graph[i.toString()].some(e => (typeof e === "object" ? e.node : e) === to.toString())) {
        const edge = weighted
          ? { node: to.toString(), weight: Math.floor(Math.random() * 10 + 1) }
          : to.toString();

        graph[i.toString()].push(edge);

        if (!directed) {
          const reverse = weighted
            ? { node: i.toString(), weight: edge.weight }
            : i.toString();
          graph[to.toString()] = graph[to.toString()] || [];
          graph[to.toString()].push(reverse);
        }
      }
    }
  }

  return graph;
}
function graphToText(graph) {
  return Object.entries(graph)
    .map(([from, edges]) => {
      if (!edges.length) return `${from}:`;
      const edgeText = edges.map(e =>
        typeof e === 'string' ? e : `${e.node}-${e.weight}`
      ).join(',');
      return `${from}:${edgeText}`;
    })
    .join('\n');
}
function showOutput(content) {
  const outputBox = document.getElementById('output-box');
  const outputContent = document.getElementById('output-content');
  outputBox.style.display = 'block';
  outputContent.textContent = content;
}

function hideOutput() {
  const outputBox = document.getElementById('output-box');
  outputBox.style.display = 'none';
}

// 🌙 DARK MODE LOGIC
const modeToggle = document.getElementById("mode-toggle");
const body = document.body;

// Check saved mode
if (localStorage.getItem("theme") === "dark") {
  body.classList.add("dark");
  modeToggle.checked = true;
}

// Toggle theme on checkbox change
modeToggle.addEventListener("change", () => {
  if (modeToggle.checked) {
    body.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    body.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
});

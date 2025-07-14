export async function bellmanFord(graph, isDirected, speed) {
  const dist = {};
  const nodes = Object.keys(graph);
  const edges = [];

  for (let u in graph) {
    for (let edge of graph[u]) {
      const v = typeof edge === "string" ? edge : edge.node;
      const weight = typeof edge === "object" ? edge.weight : 1;
      edges.push({ u, v, weight });
    }
  }

  const start = nodes[0];
  for (let node of nodes) dist[node] = Infinity;
  dist[start] = 0;

  for (let i = 0; i < nodes.length - 1; i++) {
    for (let { u, v, weight } of edges) {
      if (dist[u] + weight < dist[v]) {
        dist[v] = dist[u] + weight;
        markNode(v, "current");
        await delay(speed);
        markNode(v, "visited");
      }
    }
  }

  // Negative cycle check
  for (let { u, v, weight } of edges) {
    if (dist[u] + weight < dist[v]) {
      alert("Negative weight cycle detected!");
      return;
    }
  }

  for (let node in dist) {
    markNode(node, "final");
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function markNode(id, className) {
  const el = document.getElementById(`node-${id}`);
  if (el && !el.classList.contains("visited")) {
    el.classList.add(className);
  }
}

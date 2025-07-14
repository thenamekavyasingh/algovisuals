export async function dijkstra(graph, isDirected, speed) {
  const dist = {};
  const visited = {};
  const pq = [];

  for (let node in graph) {
    dist[node] = Infinity;
  }

  const start = Object.keys(graph)[0];
  dist[start] = 0;
  pq.push({ node: start, dist: 0 });

  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist);
    const { node: u } = pq.shift();
    if (visited[u]) continue;

    visited[u] = true;
    markNode(u, "visited");
    await delay(speed);

    for (let neighbor of graph[u]) {
      const v = typeof neighbor === "string" ? neighbor : neighbor.node;
      const weight = typeof neighbor === "object" ? neighbor.weight : 1;

      if (!visited[v] && dist[u] + weight < dist[v]) {
        dist[v] = dist[u] + weight;
        pq.push({ node: v, dist: dist[v] });
        markNode(v, "current");
        await delay(speed);
      }
    }
  }

  // Optionally mark final shortest path tree
  for (let node in visited) {
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

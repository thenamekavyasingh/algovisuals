export async function dfs(graph, isDirected, isWeighted, speed) {
  const visited = {};
  const start = Object.keys(graph)[0];

  await dfsVisit(start);

  async function dfsVisit(node) {
    visited[node] = true;
    markNode(node, "current");
    await delay(speed);
    markNode(node, "visited");

    for (let neighbor of graph[node]) {
      const next = typeof neighbor === "string" ? neighbor : neighbor.node;
      if (!visited[next]) {
        await dfsVisit(next);
      }
    }
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

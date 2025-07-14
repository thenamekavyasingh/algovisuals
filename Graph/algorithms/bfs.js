export async function bfs(graph, isDirected, isWeighted, speed) {
  const visited = {};
  const queue = [];

  const start = Object.keys(graph)[0]; // Start from the first node
  queue.push(start);
  visited[start] = true;
  markNode(start, "current");
  await delay(speed);

  while (queue.length > 0) {
    const current = queue.shift();
    markNode(current, "visited");
    await delay(speed);

    for (let neighbor of graph[current]) {
      const next = typeof neighbor === "string" ? neighbor : neighbor.node;

      if (!visited[next]) {
        visited[next] = true;
        queue.push(next);
        markNode(next, "current");
        await delay(speed);
        markNode(next, "visited");
      }
    }
  }

  // ✅ Optionally throw confetti or call onComplete()
  // throwConfetti(); ← if you’ve built it
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



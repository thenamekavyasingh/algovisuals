export async function topologicalSort(graph, isDirected, speed) {
  if (!isDirected) {
    alert("Topological sort only works on Directed Acyclic Graphs (DAGs).");
    return;
  }

  const visited = {};
  const stack = [];

  for (let node in graph) {
    if (!visited[node]) {
      await dfsTopo(node);
    }
  }

  for (let i = 0; i < stack.length; i++) {
    markNode(stack[i], "final");
    await delay(speed);
  }

  async function dfsTopo(node) {
    visited[node] = true;
    markNode(node, "current");
    await delay(speed);

    for (let neighbor of graph[node]) {
      const next = typeof neighbor === "string" ? neighbor : neighbor.node;
      if (!visited[next]) {
        await dfsTopo(next);
      }
    }

    stack.unshift(node); // Prepend to mimic stack behavior
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

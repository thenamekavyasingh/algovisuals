export function renderGraph(canvas, graph, directed, weighted) {
  canvas.innerHTML = "";

  const nodes = Object.keys(graph);
  const centerX = canvas.offsetWidth / 2;
  const centerY = canvas.offsetHeight / 2;
  const radius = 140;

  const positions = {};
  const total = nodes.length;

  // 🟢 Place nodes in circle
  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / total;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    positions[node] = { x, y };

    const nodeDiv = document.createElement("div");
    nodeDiv.className = "node";
    nodeDiv.id = `node-${node}`;
    nodeDiv.style.left = `${x - 20}px`;
    nodeDiv.style.top = `${y - 20}px`;
    nodeDiv.innerHTML = `<span>${node}</span>`;
    canvas.appendChild(nodeDiv);
  });

  // 🔵 Draw edges
  nodes.forEach(from => {
    graph[from].forEach(edge => {
      const to = typeof edge === 'string' ? edge : edge.node;
      const weight = typeof edge === 'object' ? edge.weight : null;

      const x1 = positions[from].x;
      const y1 = positions[from].y;
      if (!positions[to]) return;
      const x2 = positions[to].x;
      const y2 = positions[to].y;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);

      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      const edgeDiv = document.createElement("div");
      edgeDiv.className = `edge ${directed ? 'directed' : ''}`;
      edgeDiv.style.width = `${length}px`;
      edgeDiv.style.left = `${x1}px`;
      edgeDiv.style.top = `${y1}px`;
      edgeDiv.style.transform = `rotate(${angle}deg)`;

      canvas.appendChild(edgeDiv);

      // Label for weight
      if (weighted && weight !== null) {
        const label = document.createElement("div");
        label.className = "edge-label";
        label.style.left = `${(x1 + x2) / 2}px`;
        label.style.top = `${(y1 + y2) / 2}px`;
        label.textContent = weight;
        canvas.appendChild(label);
      }
    });
  });
}

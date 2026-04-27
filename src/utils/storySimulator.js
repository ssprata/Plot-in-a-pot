/**
 * Simula todos os caminhos possíveis e faz o log de cobertura de nós.
 */
export function simulateStoryPlaythrough(nodes, edges) {
  const reachableNodes = new Set();
  const queue = [];
  const visitedStates = new Map();

  // Encontrar o ponto de partida
  const startNode = nodes.find(n => n.data.label.toLowerCase() === 'start') || nodes[0];
  if (!startNode) return { error: "Nó de início não encontrado." };

  queue.push({ nodeId: startNode.id, state: {} });

  while (queue.length > 0) {
    const { nodeId, state } = queue.shift();
    reachableNodes.add(nodeId);

    const currentNode = nodes.find(n => n.id === nodeId);
    if (!currentNode) continue;

    // Processar modificadores de estado
    const newState = { ...state };
    const content = currentNode.data.content || "";
    const modRegex = /set:\s*([\w_]+)\s*=\s*(true|false)/gi;
    let match;
    while ((match = modRegex.exec(content))) {
      newState[match[1]] = match[2].toLowerCase() === 'true';
    }

    // Evitar ciclos infinitos
    const stateStr = JSON.stringify(newState);
    if (!visitedStates.has(nodeId)) visitedStates.set(nodeId, []);
    if (visitedStates.get(nodeId).includes(stateStr)) continue;
    visitedStates.get(nodeId).push(stateStr);

    // Explorar saídas
    const outgoing = edges.filter(e => e.source === nodeId);
    outgoing.forEach(edge => {
      // Verificar requisitos na label da aresta/escolha
      const choice = currentNode.data.choices?.find(c => c.id === edge.sourceHandle);
      const reqText = choice?.text || "";
      const reqRegex = /req:\s*([\w_]+)\s*==\s*(true|false)/gi;
      let reqMatch;
      let canPass = true;

      while ((reqMatch = reqRegex.exec(reqText))) {
        const varName = reqMatch[1];
        const expected = reqMatch[2].toLowerCase() === 'true';
        const currentVal = newState[varName] === undefined ? false : newState[varName];
        if (currentVal !== expected) canPass = false;
      }

      if (canPass) {
        queue.push({ nodeId: edge.target, state: { ...newState } });
      }
    });
  }

  // Comparar com o total de nós
  const unreachable = nodes.filter(n => !reachableNodes.has(n.id));

  return {
    reachableCount: reachableNodes.size,
    totalNodes: nodes.length,
    unreachableNodes: unreachable.map(n => n.data.label),
    isPerfect: unreachable.length === 0
  };
}
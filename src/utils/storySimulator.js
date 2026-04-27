export function simulateStoryPlaythrough(nodes, edges) {
  const reachableNodes = new Set();
  const queue = [];
  const visitedStates = new Map();

  let startNode = nodes.find(n => {
    const tags = n.data.tags ? n.data.tags.toLowerCase() : '';
    return tags.includes('start');
  });

  // Se nao existir etiqueta, tentar encontrar um que se chame 'start', ou usar o primeiro do array
  if (!startNode) {
    startNode = nodes.find(n => n.data.label.toLowerCase() === 'start') || nodes[0];
  }

  // --- NOVA LÓGICA: Procurar o StoryInit ---
  const initNode = nodes.find(n => n.data.label.toLowerCase() === 'storyinit');
  let initialState = {};

  if (initNode) {
    const modRegex = /set:\s*([\w_]+)\s*=\s*(true|false)/gi;
    let match;
    while ((match = modRegex.exec(initNode.data.content || ""))) {
      initialState[match[1]] = match[2].toLowerCase() === 'true';
    }
  }

  queue.push({ nodeId: startNode.id, state: initialState });

  while (queue.length > 0) {
    const { nodeId, state } = queue.shift();
    reachableNodes.add(nodeId);

    const currentNode = nodes.find(n => n.id === nodeId);
    if (!currentNode) continue;

    const newState = { ...state };
    const content = currentNode.data.content || "";
    const modRegex = /set:\s*([\w_]+)\s*=\s*(true|false)/gi;
    let match;
    while ((match = modRegex.exec(content))) {
      newState[match[1]] = match[2].toLowerCase() === 'true';
    }

    const stateStr = JSON.stringify(newState);
    if (!visitedStates.has(nodeId)) visitedStates.set(nodeId, []);
    if (visitedStates.get(nodeId).includes(stateStr)) continue;
    visitedStates.get(nodeId).push(stateStr);

    const outgoing = edges.filter(e => e.source === nodeId);
    outgoing.forEach(edge => {
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

  // Filtrar o StoryInit e outras passagens especiais da contagem de nós inalcançáveis
  // visto que eles nunca são acedidos diretamente pelo jogador
  const systemNodes = ['storyinit', 'storytitle', 'storydata', 'storycaption'];
  const unreachable = nodes.filter(n => {
    const labelLower = n.data.label.toLowerCase();
    const isSystemNode = systemNodes.includes(labelLower) || (n.data.tags && n.data.tags.toLowerCase().includes('secreto'));
    return !reachableNodes.has(n.id) && !isSystemNode;
  });

  return {
    reachableCount: reachableNodes.size,
    totalNodes: nodes.length,
    unreachableNodes: unreachable.map(n => n.data.label),
    isPerfect: unreachable.length === 0
  };
}
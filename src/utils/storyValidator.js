/**
 * Algoritmo BFS com Propagação de Estado
 */
export function validateStoryFlow(nodes, edges) {
  const reachableChoices = new Set(); 
  const visitedStates = new Map(); 

  // CORREÇÃO: Encontrar o nó de início real
  const startNode = nodes.find(n => n.data.label.toLowerCase() === 'start') || nodes[0];
  
  if (!startNode) return [];

  // Iniciar a fila com o ID do nó encontrado
  const queue = [{ nodeId: startNode.id, state: {} }];

  while (queue.length > 0) {
    const { nodeId, state } = queue.shift();
    const currentNode = nodes.find(n => n.id === nodeId);
    if (!currentNode) continue;

    // --- Passo 1: Aplicar Modificadores do Nó Atual ---
    const newState = { ...state };
    const modifiers = extractModifiers(currentNode.data.content || "");
    Object.assign(newState, modifiers);

    // --- Passo 2: Evitar Ciclos Infinitos ---
    const stateString = JSON.stringify(newState);
    if (!visitedStates.has(nodeId)) visitedStates.set(nodeId, []);
    if (visitedStates.get(nodeId).includes(stateString)) continue; 
    visitedStates.get(nodeId).push(stateString);

    // --- Passo 3: Analisar Saídas (Arestas) ---
    const outgoingEdges = edges.filter(e => e.source === nodeId);

    outgoingEdges.forEach(edge => {
      const choiceData = getChoiceDataFromNode(currentNode, edge.sourceHandle);
      const requirements = extractRequirements(choiceData?.text || "");

      if (checkRequirements(newState, requirements)) {
        reachableChoices.add(edge.id); 
        queue.push({ nodeId: edge.target, state: { ...newState } });
      }
    });
  }

  // --- Passo 4: Relatório de Erros ---
  return edges
    .filter(edge => !reachableChoices.has(edge.id))
    .map(edge => ({
      edgeId: edge.id,
      sourceLabel: nodes.find(n => n.id === edge.source)?.data.label || "Desconhecido",
      targetLabel: nodes.find(n => n.id === edge.target)?.data.label || "Desconhecido",
    }));
}

// Funções Auxiliares de Parsing com Regex Melhorada
function extractModifiers(content) {
  const mods = {};
  // Suporta espaços extras e ignora maiúsculas/minúsculas
  const regex = /set:\s*([\w_]+)\s*=\s*(true|false)/gi;
  let match;
  while ((match = regex.exec(content))) {
    mods[match[1]] = match[2].toLowerCase() === 'true';
  }
  return mods;
}

function extractRequirements(text) {
  const reqs = {};
  // Suporta espaços extras e ignora maiúsculas/minúsculas
  const regex = /req:\s*([\w_]+)\s*==\s*(true|false)/gi;
  let match;
  while ((match = regex.exec(text))) {
    reqs[match[1]] = match[2].toLowerCase() === 'true';
  }
  return reqs;
}

function checkRequirements(state, reqs) {
  return Object.keys(reqs).every(key => {
    const val = state[key] === undefined ? false : state[key];
    return val === reqs[key];
  });
}

function getChoiceDataFromNode(node, handleId) {
  return node.data.choices?.find(c => c.id === handleId);
}
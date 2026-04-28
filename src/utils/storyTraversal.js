// src/utils/storyTraversal.js
import { findStartNode, getInitialState, applyModifiers, canAccessChoice } from './sugarcubeLogic';

export function traverseGraph(nodes, edges) {
  const reachableNodes = new Set();
  const reachableEdges = new Set();
  const visitedStates = new Map();
  
  // NOVO: Guarda o percurso e a mochila usados para chegar a cada nó
  const arrivalHistory = new Map(); 

  const startNode = findStartNode(nodes);
  if (!startNode) return { reachableNodes, reachableEdges, arrivalHistory, error: "Nó de início não encontrado." };

  const initialState = getInitialState(nodes);
  
  // NOVO: Iniciamos a fila com a propriedade 'path' a registar o primeiro passo
  const queue = [{ 
    nodeId: startNode.id, 
    state: initialState, 
    path: [startNode.data.label] 
  }];

  while (queue.length > 0) {
    const { nodeId, state, path } = queue.shift();
    
    reachableNodes.add(nodeId);

    const currentNode = nodes.find(n => n.id === nodeId);
    if (!currentNode) continue;

    const newState = applyModifiers(currentNode.data.content, state);

    const stateStr = JSON.stringify(newState);
    if (!visitedStates.has(nodeId)) visitedStates.set(nodeId, []);
    if (!arrivalHistory.has(nodeId)) arrivalHistory.set(nodeId, []);
    
    if (visitedStates.get(nodeId).includes(stateStr)) continue;

    if (visitedStates.get(nodeId).length >= 10) continue;

    visitedStates.get(nodeId).push(stateStr);
    
    // NOVO: Registar como chegámos aqui
    arrivalHistory.get(nodeId).push({ path, state: newState });

    const outgoing = edges.filter(e => e.source === nodeId);
    outgoing.forEach(edge => {
      const choice = currentNode.data.choices?.find(c => c.id === edge.sourceHandle);
      if (!choice) return;

      if (canAccessChoice(currentNode.data.content, choice.text, newState)) {
        reachableEdges.add(edge.id);
        
        // NOVO: Obter o nome do próximo nó para adicionar ao trilho de migalhas
        const nextNode = nodes.find(n => n.id === edge.target);
        const nextLabel = nextNode ? nextNode.data.label : "Desconhecido";
        
        queue.push({ 
          nodeId: edge.target, 
          state: { ...newState }, 
          path: [...path, nextLabel] // Junta o novo passo à lista
        });
      }
    });
  }

  return { reachableNodes, reachableEdges, arrivalHistory, error: null };
}
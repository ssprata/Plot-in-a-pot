// src/utils/storyTraversal.js
import { findStartNode, getInitialState, applyModifiers, canAccessChoice } from './sugarcubeLogic';

export function traverseGraph(nodes, edges) {
  const reachableNodes = new Set();
  const reachableEdges = new Set();
  const visitedStates = new Map();

  const startNode = findStartNode(nodes);
  if (!startNode) return { reachableNodes, reachableEdges, error: "Nó de início não encontrado." };

  const initialState = getInitialState(nodes);
  const queue = [{ nodeId: startNode.id, state: initialState }];

  while (queue.length > 0) {
    const { nodeId, state } = queue.shift();
    
    // Regista o nó como visitado
    reachableNodes.add(nodeId);

    const currentNode = nodes.find(n => n.id === nodeId);
    if (!currentNode) continue;

    const newState = applyModifiers(currentNode.data.content, state);

    const stateStr = JSON.stringify(newState);
    if (!visitedStates.has(nodeId)) visitedStates.set(nodeId, []);
    
    // Evita testar exatamente a mesma mochila no mesmo nó
    if (visitedStates.get(nodeId).includes(stateStr)) continue;

    // Disjuntor de Segurança contra Loops de Grinding
    if (visitedStates.get(nodeId).length >= 10) {
      console.warn(`Loop infinito evitado no nó: ${currentNode?.data?.label}`);
      continue;
    }

    visitedStates.get(nodeId).push(stateStr);

    const outgoing = edges.filter(e => e.source === nodeId);
    outgoing.forEach(edge => {
      const choice = currentNode.data.choices?.find(c => c.id === edge.sourceHandle);
      if (!choice) return;

      if (canAccessChoice(currentNode.data.content, choice.text, newState)) {
        // Regista a aresta/escolha como visitada
        reachableEdges.add(edge.id);
        queue.push({ nodeId: edge.target, state: { ...newState } });
      }
    });
  }

  return { reachableNodes, reachableEdges, error: null };
}
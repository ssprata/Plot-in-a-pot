// src/utils/storyValidator.js
import { findStartNode, getInitialState, applyModifiers, canAccessChoice } from './sugarcubeLogic';

export function validateStoryFlow(nodes, edges) {
  const reachableChoices = new Set(); 
  const visitedStates = new Map(); 

  const startNode = findStartNode(nodes);
  if (!startNode) return [];

  const initialState = getInitialState(nodes);
  const queue = [{ nodeId: startNode.id, state: initialState }];

  while (queue.length > 0) {
    const { nodeId, state } = queue.shift();
    const currentNode = nodes.find(n => n.id === nodeId);
    if (!currentNode) continue;

    const newState = applyModifiers(currentNode.data.content, state);

    const stateStr = JSON.stringify(newState);
    if (!visitedStates.has(nodeId)) visitedStates.set(nodeId, []);
    if (visitedStates.get(nodeId).includes(stateStr)) continue; 
    visitedStates.get(nodeId).push(stateStr);

    if (visitedStates.get(nodeId).length >= 10) {
      console.warn(`Loop infinito evitado no nó: ${currentNode?.data?.label}`);
      continue;
    }

    const outgoingEdges = edges.filter(e => e.source === nodeId);

    outgoingEdges.forEach(edge => {
      const choice = currentNode.data.choices?.find(c => c.id === edge.sourceHandle);
      if (!choice) return;

      if (canAccessChoice(currentNode.data.content, choice.text, newState)) {
        reachableChoices.add(edge.id); 
        queue.push({ nodeId: edge.target, state: { ...newState } });
      }
    });
  }

  // Retorna as arestas (escolhas) que nunca foram acedidas
  return edges
    .filter(edge => !reachableChoices.has(edge.id))
    .map(edge => ({
      edgeId: edge.id,
      sourceLabel: nodes.find(n => n.id === edge.source)?.data.label || "Desconhecido",
      targetLabel: nodes.find(n => n.id === edge.target)?.data.label || "Desconhecido",
    }));
}
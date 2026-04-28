// src/utils/storySimulator.js
import { findStartNode, getInitialState, applyModifiers, canAccessChoice, isSystemNode } from './sugarcubeLogic';

export function simulateStoryPlaythrough(nodes, edges) {
  const reachableNodes = new Set();
  const queue = [];
  const visitedStates = new Map();

  const startNode = findStartNode(nodes);
  if (!startNode) return { error: "No de inicio nao encontrado." };

  const initialState = getInitialState(nodes);
  queue.push({ nodeId: startNode.id, state: initialState });

  while (queue.length > 0) {
    const { nodeId, state } = queue.shift();
    reachableNodes.add(nodeId);

    const currentNode = nodes.find(n => n.id === nodeId);
    if (!currentNode) continue;

    // Atualiza a "mochila" com o que encontrar neste nó
    const newState = applyModifiers(currentNode.data.content, state);

    const stateStr = JSON.stringify(newState);
    if (!visitedStates.has(nodeId)) visitedStates.set(nodeId, []);
    if (visitedStates.get(nodeId).includes(stateStr)) continue;
    visitedStates.get(nodeId).push(stateStr);

    const outgoing = edges.filter(e => e.source === nodeId);
    outgoing.forEach(edge => {
      const choice = currentNode.data.choices?.find(c => c.id === edge.sourceHandle);
      if (!choice) return;

      // Pergunta à biblioteca se a porta está aberta
      if (canAccessChoice(currentNode.data.content, choice.text, newState)) {
        queue.push({ nodeId: edge.target, state: { ...newState } });
      }
    });
  }

  const unreachable = nodes.filter(n => !reachableNodes.has(n.id) && !isSystemNode(n));

  return {
    reachableCount: reachableNodes.size,
    totalNodes: nodes.length,
    unreachableNodes: unreachable.map(n => n.data.label),
    isPerfect: unreachable.length === 0
  };
}
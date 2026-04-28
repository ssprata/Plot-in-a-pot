// src/utils/storySimulator.js
import { isSystemNode } from './sugarcubeLogic';
import { traverseGraph } from './storyTraversal';

export function simulateStoryPlaythrough(nodes, edges) {
  const { reachableNodes, error } = traverseGraph(nodes, edges);

  if (error) {
    return { error, reachableCount: 0, totalNodes: nodes.length, unreachableNodes: [], isPerfect: false };
  }

  const unreachable = nodes.filter(n => !reachableNodes.has(n.id) && !isSystemNode(n));

  return {
    reachableCount: reachableNodes.size,
    totalNodes: nodes.length,
    unreachableNodes: unreachable.map(n => n.data.label),
    isPerfect: unreachable.length === 0
  };
}
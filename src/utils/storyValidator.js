// src/utils/storyValidator.js
import { traverseGraph } from './storyTraversal';

export function validateStoryFlow(nodes, edges) {
  const { reachableEdges, error } = traverseGraph(nodes, edges);

  if (error) return [];

  // Retorna as arestas (escolhas) que nunca foram acedidas
  return edges
    .filter(edge => !reachableEdges.has(edge.id))
    .map(edge => ({
      edgeId: edge.id,
      sourceLabel: nodes.find(n => n.id === edge.source)?.data.label || "Desconhecido",
      targetLabel: nodes.find(n => n.id === edge.target)?.data.label || "Desconhecido",
    }));
}
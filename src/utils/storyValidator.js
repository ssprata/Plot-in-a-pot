// src/utils/storyValidator.js

//legacy reasons only, not usefull anymore, but maybe we can use it in the future for a "pre-flight check" of the story before simulating it, 
// to give the user a heads up of potential issues with their story structure. For now, it's just a placeholder for future validation logic.

import { traverseGraph } from './storyTraversal';

export function validateStoryFlow(nodes, edges) {
  // Recebe o history do motor
  const { reachableEdges, arrivalHistory, error } = traverseGraph(nodes, edges);

  if (error) return [];

  return edges
    .filter(edge => !reachableEdges.has(edge.id))
    .map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      // Tentar ir buscar o último percurso conhecido até à origem do erro
      let lastKnownPath = [];
      let lastKnownState = {};
      
      if (sourceNode && arrivalHistory.has(sourceNode.id)) {
        const history = arrivalHistory.get(sourceNode.id);
        if (history && history.length > 0) {
          // Pega no primeiro percurso encontrado que levou a esta porta
          lastKnownPath = history[0].path;
          lastKnownState = history[0].state;
        }
      }

      return {
        edgeId: edge.id,
        sourceLabel: sourceNode?.data.label || "Desconhecido",
        targetLabel: targetNode?.data.label || "Desconhecido",
        pathTrace: lastKnownPath, // <-- Exportamos o rasto
        failedState: lastKnownState // <-- Exportamos as variáveis da mochila
      };
    });
}
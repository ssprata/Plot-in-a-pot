// src/utils/storyValidator.js
import { traverseGraph } from './storyTraversal';

export function validateStoryFlow(nodes, edges) {
  const { reachableEdges, arrivalHistory, error } = traverseGraph(nodes, edges);

  if (error) {
    return { unreachableEdges: [], orphanNodes: [], hasReachableEnd: false, reachableEndNodes: [], error };
  }

  const reachableNodeIds = new Set(arrivalHistory.keys());

  const outgoingEdgesByNode = edges.reduce((map, edge) => {
    if (!map.has(edge.source)) map.set(edge.source, []);
    map.get(edge.source).push(edge);
    return map;
  }, new Map());

  // --- Arestas inacessíveis (lógica já existente) ---
  const unreachableEdges = edges
    .filter(edge => !reachableEdges.has(edge.id))
    .map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      const sourceReached = sourceNode && reachableNodeIds.has(sourceNode.id);

      let lastKnownPath = [];
      let lastKnownState = {};
      if (sourceReached) {
        const history = arrivalHistory.get(sourceNode.id);
        if (history?.length > 0) {
          lastKnownPath = history[0].path;
          lastKnownState = history[0].state;
        }
      }

      return {
        edgeId: edge.id,
        reason: sourceReached ? 'condition_never_met' : 'source_unreachable',
        sourceLabel: sourceNode?.data?.label ?? 'Desconhecido',
        targetLabel: targetNode?.data?.label ?? 'Desconhecido',
        pathTrace: lastKnownPath,
        failedState: lastKnownState,
      };
    });

  // --- Nós órfãos (existem mas nunca são alcançados) ---
  const orphanNodes = nodes
    .filter(node => {
      const isSecret   = node.data?.secret === true || 
                         String(node.data?.tags || '').toLowerCase().includes('secreto');
      const isReachable = reachableNodeIds.has(node.id);
      return !isReachable && !isSecret;
    })
    .map(node => ({
      id: node.id,
      label: node.data?.label ?? 'Desconhecido',
    }));

  // --- Nós terminais alcançáveis ---
  const reachableEndNodes = nodes
    .filter(node => {
      const isReachable  = reachableNodeIds.has(node.id);
      const isSecret     = node.data?.secret === true ||
                           String(node.data?.tags || '').toLowerCase().includes('secreto');
      const hasNoOutputs = !outgoingEdgesByNode.has(node.id);
      return isReachable && !isSecret && hasNoOutputs;
    })
    .map(node => ({
      id: node.id,
      label: node.data?.label ?? 'Desconhecido',
      pathTrace: arrivalHistory.get(node.id)?.[0]?.path ?? [],
    }));

  return {
    unreachableEdges,
    orphanNodes,        // NOVO
    hasReachableEnd: reachableEndNodes.length > 0,
    reachableEndNodes,
  };
}
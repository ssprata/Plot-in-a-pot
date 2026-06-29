// src/utils/storyValidator.js
import { traverseGraph } from './storyTraversal';

// FIX #4: Constante partilhada para a tag de nós secretos — fácil de alterar num único sítio
const SECRET_TAG = 'secreto';

function isSecretNode(node) {
  if (node.data?.secret === true) return true;
  const tags = node.data?.tags;
  if (Array.isArray(tags)) return tags.map(t => t.toLowerCase()).includes(SECRET_TAG);
  return String(tags || '').toLowerCase().includes(SECRET_TAG);
}

export function validateStoryFlow(nodes, edges) {
  // FIX #3: Desestruturar reachableNodes diretamente em vez de derivar de arrivalHistory
  const { reachableNodes, reachableEdges, arrivalHistory, error } = traverseGraph(nodes, edges);

  if (error) {
    return { unreachableEdges: [], orphanNodes: [], hasReachableEnd: false, reachableEndNodes: [], error };
  }

  // FIX #1: Pré-computar nodeMap uma vez — lookups O(1) em vez de nodes.find() O(N) por edge
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  const outgoingEdgesByNode = edges.reduce((map, edge) => {
    if (!map.has(edge.source)) map.set(edge.source, []);
    map.get(edge.source).push(edge);
    return map;
  }, new Map());

  // FIX #5: Pré-computar edges com targets válidos por nó, para detetar becos sem saída reais
  const validOutgoingByNode = new Map();
  edges.forEach(edge => {
    if (!nodeMap.has(edge.target)) return; // edge para target inexistente — não conta
    if (!validOutgoingByNode.has(edge.source)) validOutgoingByNode.set(edge.source, []);
    validOutgoingByNode.get(edge.source).push(edge);
  });

  // --- Arestas inacessíveis ---
  const unreachableEdges = edges
    .filter(edge => !reachableEdges.has(edge.id))
    .map(edge => {
      // FIX #1: Lookup O(1) via nodeMap
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);

      // FIX #3: Usar reachableNodes diretamente
      const sourceReached = sourceNode && reachableNodes.has(sourceNode.id);

      let lastKnownPath = [];
      let lastKnownState = {};
      if (sourceReached) {
        const history = arrivalHistory.get(sourceNode.id);
        if (history?.length > 0) {
          // FIX #2: Usar o último histórico (mais estados aplicados) em vez do primeiro
          const last = history[history.length - 1];
          lastKnownPath = last.path;
          lastKnownState = last.state;
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
      // FIX #4: Usar função isSecretNode robusta com suporte a Array de tags
      const isSecret   = isSecretNode(node);
      // FIX #3: Usar reachableNodes diretamente
      const isReachable = reachableNodes.has(node.id);
      return !isReachable && !isSecret;
    })
    .map(node => ({
      id: node.id,
      label: node.data?.label ?? 'Desconhecido',
    }));

  // --- Nós terminais alcançáveis ---
  const reachableEndNodes = nodes
    .filter(node => {
      const isReachable = reachableNodes.has(node.id);  // FIX #3
      const isSecret    = isSecretNode(node);            // FIX #4
      // FIX #5: Só é terminal se não tiver edges para targets que realmente existem
      const hasNoValidOutputs = !validOutgoingByNode.has(node.id);
      return isReachable && !isSecret && hasNoValidOutputs;
    })
    .map(node => ({
      id: node.id,
      label: node.data?.label ?? 'Desconhecido',
      // FIX #2: Usar o último histórico para o pathTrace também
      pathTrace: arrivalHistory.get(node.id)?.at(-1)?.path ?? [],
    }));

  // FIX #5: Reportar nós com edges mas todos os targets inexistentes (becos sem saída ocultos)
  const deadEndNodes = nodes
    .filter(node => {
      const isReachable    = reachableNodes.has(node.id);
      const isSecret       = isSecretNode(node);
      const hasEdges       = outgoingEdgesByNode.has(node.id);
      const hasValidOutputs = validOutgoingByNode.has(node.id);
      return isReachable && !isSecret && hasEdges && !hasValidOutputs;
    })
    .map(node => ({
      id: node.id,
      label: node.data?.label ?? 'Desconhecido',
      pathTrace: arrivalHistory.get(node.id)?.at(-1)?.path ?? [],
    }));

  // FIX #6: Incluir error: null explicitamente no retorno de sucesso
  return {
    unreachableEdges,
    orphanNodes,
    hasReachableEnd: reachableEndNodes.length > 0,
    reachableEndNodes,
    deadEndNodes,  // FIX #5: nós com edges mas todos os targets inexistentes
    arrivalHistory,
    error: null,
  };
}
// src/utils/storyValidator.js
import { traverseGraph } from './storyTraversal';

// Valida a estrutura do fluxo de história.
// Usa o percurso do grafo para determinar alcance, depois classifica nós/arestas como:
// - inacessíveis
// - órfãos
// - terminais alcançáveis
// - dead ends com saídas inválidas
// Nós secretos são excluídos de alguns relatórios porque podem ser intencionais.

// Tag usada para identificar nós que são secretos e devem ser ignorados na validação normal
const SECRET_TAG = 'secreto';

// Função auxiliar para detectar se um nó deve ser tratado como secreto.
// Aceita tanto a flag explícita node.data.secret como a presença da tag secreta.
function isSecretNode(node) {
  if (node.data?.secret === true) return true;
  const tags = node.data?.tags;
  if (Array.isArray(tags)) return tags.map(t => t.toLowerCase()).includes(SECRET_TAG);
  return String(tags || '').toLowerCase().includes(SECRET_TAG);
}

export function validateStoryFlow(nodes, edges) {
  // Executa o percurso do grafo para descobrir quais nós e arestas podem ser alcançados
  // a partir do nó inicial, além de armazenar o histórico de chegadas a cada nó.
  const { reachableNodes, reachableEdges, arrivalHistory, error } = traverseGraph(nodes, edges);

  if (error) {
    // Se o percurso falhar, retorna um objecto de erro vazio que pode ser usado pelo caller.
    return { unreachableEdges: [], orphanNodes: [], hasReachableEnd: false, reachableEndNodes: [], reachableNodes: new Set(), reachableEdges: new Set(), error };
  }

  // Mapa de nós por id para consultas rápidas em O(1).
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Agrupa as arestas por nó de origem para facilitar a análise de nós com saídas e nós órfãos.
  const outgoingEdgesByNode = edges.reduce((map, edge) => {
    if (!map.has(edge.source)) map.set(edge.source, []);
    map.get(edge.source).push(edge);
    return map;
  }, new Map());

  // Filtra apenas arestas cujo target existe. Isto ajuda a diferenciar nós verdadeiramente terminais
  // de nós que têm saídas inválidas para destinos inexistentes.
  const validOutgoingByNode = new Map();
  edges.forEach(edge => {
    if (!nodeMap.has(edge.target)) return; // aresta para target inexistente: não conta como saída válida
    if (!validOutgoingByNode.has(edge.source)) validOutgoingByNode.set(edge.source, []);
    validOutgoingByNode.get(edge.source).push(edge);
  });

  // --- Arestas inacessíveis ---
  // Lista arestas que não foram marcadas como alcançáveis pelo percurso do grafo.
  const unreachableEdges = edges
    .filter(edge => !reachableEdges.has(edge.id))
    .map(edge => {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);

      // Determina se o nó de origem chegou a ser alcançado.
      // Se não, a aresta é inacessível porque o nó de origem é inatingível.
      const sourceReached = sourceNode && reachableNodes.has(sourceNode.id);

      let lastKnownPath = [];
      let lastKnownState = {};
      if (sourceReached) {
        const history = arrivalHistory.get(sourceNode.id);
        if (history?.length > 0) {
          // Usa o último histórico conhecido nesse nó para anotação de diagnóstico.
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


  // --- Nós órfãos ---
  // Nós que existem no grafo mas não são alcançados a partir do início.
  // Nós secretos são excluídos desta lista porque podem ser intencionalmente inacessíveis.
  const orphanNodes = nodes
    .filter(node => {
      const isSecret   = isSecretNode(node);
      const isReachable = reachableNodes.has(node.id);
      return !isReachable && !isSecret;
    })
    .map(node => ({
      id: node.id,
      label: node.data?.label ?? 'Desconhecido',
    }));


  // --- Nós terminais alcançáveis ---
  // Nós alcançáveis que não têm saídas válidas para targets existentes.
  const reachableEndNodes = nodes
    .filter(node => {
      const isReachable = reachableNodes.has(node.id);
      const isSecret    = isSecretNode(node);
      const hasNoValidOutputs = !validOutgoingByNode.has(node.id);
      return isReachable && !isSecret && hasNoValidOutputs;
    })
    .map(node => ({
      id: node.id,
      label: node.data?.label ?? 'Desconhecido',
      pathTrace: arrivalHistory.get(node.id)?.at(-1)?.path ?? [],
    }));

  // --- Nós com arestas válidas mas sem targets existentes ---
  // Esses nós podem parecer ter saídas, mas todas as arestas apontam para destinos inválidos.
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

  return {
    unreachableEdges,
    orphanNodes,
    hasReachableEnd: reachableEndNodes.length > 0,
    reachableEndNodes,
    deadEndNodes,  // Nós com arestas mas todos os destinos são inválidos.
    arrivalHistory,
    reachableNodes,
    reachableEdges,
    error: null,
  };
}
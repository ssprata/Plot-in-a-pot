// src/utils/storyTraversal.js
import { findStartNode, getInitialState, applyModifiers, canAccessChoice } from './sugarcubeLogic';

const safeClone = typeof structuredClone === 'function' ? structuredClone : (obj) => JSON.parse(JSON.stringify(obj));


export function traverseGraph(nodes, edges) {
  // Conjunto de IDs de nós que podem ser alcançados a partir do ponto de partida
  const reachableNodes = new Set();
  // Conjunto de IDs de arestas que podem ser usadas em caminhos válidos
  const reachableEdges = new Set();

  // Rastreamento de estados já visitados por nó para evitar explorar o mesmo estado duas vezes
  const visitedStates = new Map();
  // Histórico de chegadas por nó, usado para analisar caminhos e estados finais
  const arrivalHistory = new Map();

  // Mapa de nós por id para consultas rápidas de O(1)
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Agrupa arestas por nó de origem para facilitar o percurso das adjacências
  const edgesBySource = new Map();
  edges.forEach(e => {
    if (!edgesBySource.has(e.source)) edgesBySource.set(e.source, []);
    edgesBySource.get(e.source).push(e);
  });

  // Identifica o nó inicial da história
  const startNode = findStartNode(nodes);
  if (!startNode) return { reachableNodes, reachableEdges, arrivalHistory, error: "Nó de início não encontrado." };

  // Estado inicial global da história, antes de aplicar modificadores de nós
  const initialState = getInitialState(nodes);

  // Fila para o algoritmo de busca em largura (BFS), armazenando nó, estado e caminho
  const queue = [{
    nodeId: startNode.id,
    state: initialState,
    path: [startNode.data.label]
  }];

  // FIX #3: Rastrear nós onde o limite foi atingido para aviso no final
  const cycleLimitHit = new Set();

  while (queue.length > 0) {
    const { nodeId, state, path } = queue.shift();

    // Busca o nó atual com base no id e ignora se não existir
    const currentNode = nodeMap.get(nodeId);
    if (!currentNode) continue;
    reachableNodes.add(nodeId);

    // Aplica alterações de estado definidas no conteúdo do nó antes de avaliar escolhas
    const newState = applyModifiers(currentNode.data.content, state);

    // Serialização do estado para comparação de estados visitados
    const stateStr = JSON.stringify(newState);
    if (!visitedStates.has(nodeId)) visitedStates.set(nodeId, []);
    if (!arrivalHistory.has(nodeId)) arrivalHistory.set(nodeId, []);

    // Se este estado já foi processado neste nó, não precisamos reprocessá-lo
    if (visitedStates.get(nodeId).includes(stateStr)) continue;

    // Se já processamos muitos estados diferentes neste nó, considera ciclo e ignora novos caminhos
    if (visitedStates.get(nodeId).length >= 10) {
      if (!cycleLimitHit.has(nodeId)) {
        cycleLimitHit.add(nodeId);
        console.warn(
          `[storyTraversal] Nó "${currentNode.data.label}" (id: ${nodeId}) atingiu o limite de 10 estados visitados — possível ciclo infinito. Caminhos adicionais a partir deste nó foram ignorados.`
        );
      }
      continue;
    }

    visitedStates.get(nodeId).push(stateStr);
    arrivalHistory.get(nodeId).push({ path, state: newState });

    // Lista de arestas de saída do nó atual
    const outgoing = edgesBySource.get(nodeId) || [];

    outgoing.forEach(edge => {
      // Encontra a escolha correspondente à aresta atual
      const choice = currentNode.data.choices?.find(c => c.id === edge.sourceHandle);
      if (!choice) return;

      // Verifica se a escolha está disponível dado o estado atual
      if (canAccessChoice(currentNode.data.content, choice.text, newState)) {
        reachableEdges.add(edge.id);

        // Busca o próximo nó de forma eficiente
        const nextNode = nodeMap.get(edge.target);
        const nextLabel = nextNode ? nextNode.data.label : "Desconhecido";

        let stateForNextNode = safeClone(newState);
        if (choice.setter) {
          const normalizedSetter = choice.setter.toLowerCase().includes('<<set') 
            ? choice.setter 
            : `<<set ${choice.setter}>>`;
          stateForNextNode = applyModifiers(normalizedSetter, stateForNextNode);
        }

        queue.push({
          nodeId: edge.target,
          state: stateForNextNode,
          // Mantém apenas os últimos 50 nós no caminho para limitar o tamanho
          path: path.length < 50 ? [...path, nextLabel] : [...path.slice(-49), nextLabel]
        });
      }
    });
  }

  // Se houver nós que atingiram o limite de ciclo, regista um aviso com os seus rótulos
  if (cycleLimitHit.size > 0) {
    console.warn(
      `[storyTraversal] ${cycleLimitHit.size} nó(s) com limite de ciclo atingido:`,
      [...cycleLimitHit].map(id => nodeMap.get(id)?.data.label || id)
    );
  }

  return { reachableNodes, reachableEdges, arrivalHistory, error: null };
}
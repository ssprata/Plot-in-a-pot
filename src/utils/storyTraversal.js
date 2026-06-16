// src/utils/storyTraversal.js
import { findStartNode, getInitialState, applyModifiers, canAccessChoice } from './sugarcubeLogic';

const safeClone = typeof structuredClone === 'function' ? structuredClone : (obj) => JSON.parse(JSON.stringify(obj));


export function traverseGraph(nodes, edges) {
  const reachableNodes = new Set();
  const reachableEdges = new Set();
  const visitedStates = new Map();
  const arrivalHistory = new Map();

  // FIX #1 + #4: Pré-computar Map de id → node e mapa de adjacência source → [edges]
  // uma única vez antes do loop, em vez de nodes.find() e edges.filter() a cada iteração
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const edgesBySource = new Map();
  edges.forEach(e => {
    if (!edgesBySource.has(e.source)) edgesBySource.set(e.source, []);
    edgesBySource.get(e.source).push(e);
  });

  const startNode = findStartNode(nodes);
  if (!startNode) return { reachableNodes, reachableEdges, arrivalHistory, error: "Nó de início não encontrado." };

  const initialState = getInitialState(nodes);

  const queue = [{
    nodeId: startNode.id,
    state: initialState,
    path: [startNode.data.label]
  }];

  // FIX #3: Rastrear nós onde o limite foi atingido para aviso no final
  const cycleLimitHit = new Set();

  while (queue.length > 0) {
    const { nodeId, state, path } = queue.shift();

    // FIX #2: Só marcar como alcançável depois de confirmar que o nó existe
    const currentNode = nodeMap.get(nodeId);
    if (!currentNode) continue;
    reachableNodes.add(nodeId);

    // FIX #6: Usar structuredClone para deep copy do estado, evitando referências partilhadas
    const newState = applyModifiers(currentNode.data.content, state);

    const stateStr = JSON.stringify(newState);
    if (!visitedStates.has(nodeId)) visitedStates.set(nodeId, []);
    if (!arrivalHistory.has(nodeId)) arrivalHistory.set(nodeId, []);

    if (visitedStates.get(nodeId).includes(stateStr)) continue;

    // FIX #3: Limite de ciclos com aviso explícito em vez de paragem silenciosa
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

    // FIX #4: Lookup O(1) via mapa de adjacência pré-computado
    const outgoing = edgesBySource.get(nodeId) || [];

    outgoing.forEach(edge => {
      const choice = currentNode.data.choices?.find(c => c.id === edge.sourceHandle);
      if (!choice) return;

      if (canAccessChoice(currentNode.data.content, choice.text, newState)) {
        reachableEdges.add(edge.id);

        // FIX #1: Lookup O(1) via nodeMap em vez de nodes.find()
        const nextNode = nodeMap.get(edge.target);
        const nextLabel = nextNode ? nextNode.data.label : "Desconhecido";

        queue.push({
          nodeId: edge.target,
          // FIX #6: structuredClone para garantir deep copy independente por ramo
          state: safeClone(newState),
          // FIX #5: Limitar o path a 50 entradas para evitar crescimento descontrolado em ciclos
          path: path.length < 50 ? [...path, nextLabel] : [...path.slice(-49), nextLabel]
        });
      }
    });
  }

  // Sumário final de ciclos detetados
  if (cycleLimitHit.size > 0) {
    console.warn(
      `[storyTraversal] ${cycleLimitHit.size} nó(s) com limite de ciclo atingido:`,
      [...cycleLimitHit].map(id => nodeMap.get(id)?.data.label || id)
    );
  }

  return { reachableNodes, reachableEdges, arrivalHistory, error: null };
}
// src/utils/graphMath.js

// Funções utilitárias para manipulação de grafos representados como nós e arestas.
export function buildAdjacencyList(nodes, edges) {
  const map = {};

  // FIX #1: Inicializar TODOS os nós como chave — incluindo nós folha (só recebem ligações)
  nodes.forEach((n) => (map[n.id] = []));

  edges.forEach((e) => {
    // FIX #3: Avisar sobre edges com source/target fora dos nós conhecidos
    if (!map[e.source]) {
      console.warn(`graphMath: edge com source desconhecido "${e.source}" ignorada.`);
      return;
    }
    if (!(e.target in map)) {
      console.warn(`graphMath: edge com target desconhecido "${e.target}" ignorada.`);
      return;
    }

    // FIX #5: Evitar duplicados no array de adjacência
    if (!map[e.source].includes(e.target)) {
      map[e.source].push(e.target);
    }
  });

  return map;
}

export function buildAdjacencyListWithInverse(nodes, edges) {
  const forward = {};
  const inverse = {};

  nodes.forEach((n) => {
    forward[n.id] = [];
    inverse[n.id] = [];
  });

  edges.forEach((e) => {
    if (!(e.source in forward)) {
      console.warn(`graphMath: edge com source desconhecido "${e.source}" ignorada.`);
      return;
    }
    if (!(e.target in forward)) {
      console.warn(`graphMath: edge com target desconhecido "${e.target}" ignorada.`);
      return;
    }

    // FIX #5: Evitar duplicados em ambos os mapas
    if (!forward[e.source].includes(e.target)) {
      forward[e.source].push(e.target);
      inverse[e.target].push(e.source);
    }
  });

  return { forward, inverse };
}

export function buildAdjacencyMatrix(nodes, edges) {
  const ids = nodes.map((n) => n.id);

  const indexMap = new Map(ids.map((id, i) => [id, i]));

  const n = ids.length;
  const mat = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));

  edges.forEach((e) => {
    const i = indexMap.get(e.source);
    const j = indexMap.get(e.target);

    if (i === undefined || j === undefined) {
      console.warn(`graphMath: edge "${e.source}" → "${e.target}" ignorada — um dos nós não existe.`);
      return;
    }

    mat[i][j] = 1;
  });

  return { ids, mat };
}
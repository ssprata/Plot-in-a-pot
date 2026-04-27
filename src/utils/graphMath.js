// src/utils/graphMath.js

export function buildAdjacencyList(nodes, edges) {
  const map = {};
  nodes.forEach((n) => (map[n.id] = []));
  edges.forEach((e) => {
    if (!map[e.source]) map[e.source] = [];
    map[e.source].push(e.target);
  });
  return map;
}

export function buildAdjacencyMatrix(nodes, edges) {
  const ids = nodes.map((n) => n.id);
  const indexOf = (id) => ids.indexOf(id);
  const n = ids.length;
  const mat = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
  
  edges.forEach((e) => {
    const i = indexOf(e.source);
    const j = indexOf(e.target);
    if (i >= 0 && j >= 0) mat[i][j] = 1;
  });
  return { ids, mat };
}
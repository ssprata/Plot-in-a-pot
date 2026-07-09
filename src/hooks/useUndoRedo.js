// src/hooks/useUndoRedo.js
// Undo/Redo history hook extracted from App.jsx.
// Manages past/future snapshot stacks for the node/edge graph.
import { useState, useCallback } from 'react';

export const useUndoRedo = ({ nodesRef, edgesRef, setNodes, setEdges, setSelectedNodeId, setSelectedEdgeId }) => {
  // --- Estados do Histórico (Undo / Redo) ---
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  // Guarda instantâneos do estado atual para fornecer Undo/Redo.
  const takeSnapshot = useCallback(() => {
    setPast(prev => [...prev.slice(-50), {
      nodes: JSON.parse(JSON.stringify(nodesRef.current)),
      edges: JSON.parse(JSON.stringify(edgesRef.current))
    }]);
    setFuture([]);
  }, []);

  // Restaura o último estado gravado no histórico.
  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setFuture(prev => [{ nodes: JSON.parse(JSON.stringify(nodesRef.current)), edges: JSON.parse(JSON.stringify(edgesRef.current)) }, ...prev]);
    setPast(prev => prev.slice(0, -1));
    setNodes(previous.nodes);
    setEdges(previous.edges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [past, setNodes, setEdges]);

  // Reaplica um estado que foi desfeito.
  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setPast(prev => [...prev.slice(-50), { nodes: JSON.parse(JSON.stringify(nodesRef.current)), edges: JSON.parse(JSON.stringify(edgesRef.current)) }]);
    setFuture(prev => prev.slice(1));
    setNodes(next.nodes);
    setEdges(next.edges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [future, setNodes, setEdges]);

  return { takeSnapshot, undo, redo, past, future };
};

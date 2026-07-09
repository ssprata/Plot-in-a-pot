// src/hooks/useGraphHandlers.js
// Custom hook encapsulating ReactFlow graph event handlers:
// onConnect, onEdgeUpdate, onNodeDragStop, onNodeClick, onEdgeClick,
// handleOpenPlayMode, onEdgeDoubleClick.
import { useCallback } from 'react';
import { updateEdge } from 'reactflow';
import { updateLinkInText } from '../utils/textParsing';

/**
 * @param {Object} deps
 * @param {React.MutableRefObject} deps.nodesRef
 * @param {Function} deps.setNodes
 * @param {Function} deps.setEdges
 * @param {Function} deps.takeSnapshot
 * @param {Function} deps.syncChoicesFromText
 * @param {Function} deps.setPendingConnection
 * @param {Function} deps.setSelectedNodeId
 * @param {Function} deps.setSelectedEdgeId
 * @param {Function} deps.setIsPlayModeOpen
 * @param {Object|null} deps.activeTutorial
 * @param {Object|null} deps.activeStep
 * @param {Function} deps.t
 */
export default function useGraphHandlers({
  nodesRef,
  setNodes,
  setEdges,
  takeSnapshot,
  syncChoicesFromText,
  setPendingConnection,
  setSelectedNodeId,
  setSelectedEdgeId,
  setIsPlayModeOpen,
  activeTutorial,
  activeStep,
  t,
}) {
  // Handler chamado quando o utilizador inicia uma nova ligação.
  // Durante o tutorial, valida se a ligação é permitida.
  const onConnect = useCallback((params) => {
    if (activeTutorial) {
      if (!activeStep?.allowConnect) {
        alert(t('tutorial.actionBlocked', 'Esta ação está bloqueada durante este passo do tutorial.'));
        return;
      }
      const isSourceMatch = params.source === activeStep.connectSource;
      const isTargetMatch = params.target === activeStep.connectTarget;
      if (!isSourceMatch || !isTargetMatch) {
        alert(t('tutorial.connectBlocked', 'Liga os nós corretos indicados no tutorial.'));
        return;
      }
    }
    takeSnapshot();
    setPendingConnection(params);
  }, [takeSnapshot, activeTutorial, activeStep, t]);

  // Handler quando uma aresta existente é editada (target alterado).
  const onEdgeUpdate = useCallback((oldEdge, newConnection) => {
    if (activeTutorial) return;
    takeSnapshot();

    const currentNodes = nodesRef.current;
    const sourceNode = currentNodes.find(n => n.id === oldEdge.source);

    // Se a aresta estiver vinculada a uma escolha textual, atualiza o conteúdo do nó de origem.
    if (sourceNode && oldEdge.sourceHandle) {
      const choiceIndex = (sourceNode.data.choices || []).findIndex(c => c.id === oldEdge.sourceHandle);
      if (choiceIndex !== -1) {
        const targetNode = currentNodes.find(n => n.id === newConnection.target);
        if (targetNode) {
          const newContent = updateLinkInText(sourceNode.data.content || '', choiceIndex, targetNode.data.label);
          syncChoicesFromText(sourceNode.id, newContent);
          return;
        }
      }
    }

    // Fallback: atualiza apenas a aresta se não puder reescrever o conteúdo do nó.
    setEdges(els => updateEdge(oldEdge, newConnection, els));
  }, [setEdges, syncChoicesFromText, takeSnapshot]);

  const onNodeDragStop = useCallback((event, node) => {
    if (node.type === 'zone') return;

    let absoluteX = node.position.x;
    let absoluteY = node.position.y;

    const currentNodes = nodesRef.current;

    if (node.parentId) {
      const parent = currentNodes.find(n => n.id === node.parentId);
      if (parent) {
        absoluteX += parent.position.x;
        absoluteY += parent.position.y;
      }
    }

    const nodeWidth = node.width || 180;
    const nodeHeight = node.height || 80;
    const absoluteCenter = { x: absoluteX + nodeWidth / 2, y: absoluteY + nodeHeight / 2 };

    const matchingZone = currentNodes.find(n => {
      if (n.type !== 'zone' || n.id === node.id) return false;
      const zoneWidth = n.style?.width || n.width || 300;
      const zoneHeight = n.style?.height || n.height || 200;
      return (
        absoluteCenter.x >= n.position.x &&
        absoluteCenter.x <= n.position.x + zoneWidth &&
        absoluteCenter.y >= n.position.y &&
        absoluteCenter.y <= n.position.y + zoneHeight
      );
    });

    if (matchingZone) {
      if (node.parentId !== matchingZone.id) {
        takeSnapshot();
        setNodes(nds => nds.map(n => {
          if (n.id !== node.id) return n;
          return {
            ...n,
            parentId: matchingZone.id,
            position: { x: absoluteX - matchingZone.position.x, y: absoluteY - matchingZone.position.y },
            extent: 'parent'
          };
        }));
      }
    } else if (node.parentId) {
      takeSnapshot();
      setNodes(nds => nds.map(n => {
        if (n.id !== node.id) return n;
        const { parentId, extent, ...rest } = n;
        return { ...rest, position: { x: absoluteX, y: absoluteY } };
      }));
    }
  }, [setNodes, takeSnapshot]);

  const onNodeClick = useCallback((event, node) => setSelectedNodeId(node.id), []);

  const onEdgeClick = useCallback((event, edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
  }, []);

  const handleOpenPlayMode = useCallback(() => {
    const hasSyntaxErrors = nodesRef.current.some(node => node.data.warnings?.length > 0);
    if (hasSyntaxErrors) {
      alert(t('alerts.playModeBlocked'));
      return;
    }
    setIsPlayModeOpen(true);
  }, [t]);

  const onEdgeDoubleClick = useCallback((event, edge) => {
    event.preventDefault();
    event.stopPropagation();

    const reactFlowBounds = document.querySelector('.react-flow').getBoundingClientRect();
    const transformElement = document.querySelector('.react-flow__viewport');
    let zoom = 1, panX = 0, panY = 0;

    if (transformElement) {
      const matrix = new DOMMatrix(window.getComputedStyle(transformElement).transform);
      zoom = matrix.a;
      panX = matrix.e;
      panY = matrix.f;
    }

    const x = (event.clientX - reactFlowBounds.left - panX) / zoom;
    const y = (event.clientY - reactFlowBounds.top - panY) / zoom;

    setEdges(eds => eds.map(e => {
      if (e.id !== edge.id) return e;
      return {
        ...e,
        type: 'editable',
        data: { ...e.data, waypoints: [...(e.data?.waypoints || []), { x, y }] }
      };
    }));
  }, [setEdges]);

  return {
    onConnect,
    onEdgeUpdate,
    onNodeDragStop,
    onNodeClick,
    onEdgeClick,
    handleOpenPlayMode,
    onEdgeDoubleClick,
  };
}

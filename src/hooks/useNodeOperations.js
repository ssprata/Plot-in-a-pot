import { useCallback } from 'react';

/**
 * Custom hook that encapsulates node management operations:
 * adding, deleting, duplicating, updating, and setting the start node.
 *
 * @param {Object} params
 * @param {React.MutableRefObject} params.nodesRef - Ref to current nodes array
 * @param {Function} params.setNodes - ReactFlow setNodes updater
 * @param {Function} params.setEdges - ReactFlow setEdges updater
 * @param {Function} params.setSelectedNodeId - Setter for the currently selected node ID
 * @param {string|null} params.selectedNodeId - Currently selected node ID
 * @param {Function} params.takeSnapshot - Undo/redo snapshot function
 * @param {Function} params.syncChoicesFromText - Choice sync callback from useChoiceSync
 * @param {Function} params.t - i18next translation function
 * @param {Object|null} params.activeTutorial - Active tutorial object (or null)
 * @param {Object|null} params.activeStep - Active tutorial step (or null)
 * @returns {{ addNode: Function, deleteNode: Function, duplicateNode: Function, updateSelectedNode: Function, setStartNode: Function }}
 */
export function useNodeOperations({
  nodesRef, setNodes, setEdges, setSelectedNodeId, selectedNodeId,
  takeSnapshot, syncChoicesFromText, t, activeTutorial, activeStep
}) {

  const deleteNode = useCallback((nodeIdToRemove) => {
    if (!nodeIdToRemove) return;
    takeSnapshot();
    setNodes(nds => {
      const target = nds.find(n => n.id === nodeIdToRemove);
      const isZone = target?.type === 'zone';
      return nds
        .filter(n => n.id !== nodeIdToRemove)
        .map(n => {
          if (isZone && n.parentId === nodeIdToRemove) {
            const { parentId, extent, ...rest } = n;
            return { ...rest, position: { x: (target.position.x || 0) + n.position.x, y: (target.position.y || 0) + n.position.y } };
          }
          return n;
        });
    });
    setEdges(eds => eds.filter(e => e.source !== nodeIdToRemove && e.target !== nodeIdToRemove));
    if (selectedNodeId === nodeIdToRemove) setSelectedNodeId(null);
  }, [selectedNodeId, setNodes, setEdges, takeSnapshot]);

  const addNode = useCallback((type, presetLabel = null, presetTags = '') => {
    if (activeTutorial) {
      if (activeStep?.allowAddNode !== type) {
        return;
      }
    }
    const currentNodes = nodesRef.current;

    if (presetLabel) {
      const existingNode = currentNodes.find(n => n.data.label.toLowerCase() === presetLabel.toLowerCase());
      if (existingNode) {
        alert(t('alerts.specialNodeExists', `O nó especial "${presetLabel}" já existe no projeto.`));
        setSelectedNodeId(existingNode.id);
        return;
      }
    }

    takeSnapshot();
    const numericIds = currentNodes.map(n => parseInt(n.id, 10)).filter(n => !isNaN(n));
    const nextIdNum = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
    const id = String(nextIdNum);

    let label = presetLabel;
    if (!label) {
      let baseLabel = type === 'javascript'
        ? 'Script'
        : type === 'css'
          ? t('topBar.nodeLabels.style')
          : type === 'zone'
            ? 'Zona'
            : t('topBar.nodeLabels.scene');

      label = baseLabel;
      let labelNum = 1;
      const existingLabels = new Set(currentNodes.map(n => n.data.label));
      while (existingLabels.has(label)) {
        label = `${baseLabel} ${++labelNum}`;
      }
    }

    const offset = currentNodes.length;
    const newNode = {
      id,
      type,
      position: { x: 200 + (offset % 5) * 80, y: 50 + ((offset / 5) | 0) * 80 },
      ...(type === 'zone' ? { style: { width: 300, height: 200, pointerEvents: 'none' } } : {}),
      data: {
        label,
        nodeType: type,
        content: '',
        choices: [],
        tags: presetTags || (type === 'zone' ? 'secreto, zone' : ''),
        ...(type === 'zone' ? { color: '#f59e0b' } : {})
      }
    };

    setNodes(nds => [...nds, newNode]);
    setSelectedNodeId(id);
  }, [setNodes, t, takeSnapshot, activeTutorial, activeStep]);

  const setStartNode = useCallback((nodeId) => {
    const targetNode = nodesRef.current.find(n => n.id === nodeId);
    if (!targetNode) return;
    takeSnapshot();

    const newLabel = targetNode.data.label;

    setNodes(nds => {
      const storyDataNode = nds.find(n => n.data.label.toLowerCase() === 'storydata');

      let storyDataObj = {
        ifid: crypto.randomUUID ? crypto.randomUUID() : 'F3F82260-1419-48CB-B1DC-2C3C56D7324B',
        format: 'SugarCube',
        'format-version': '2.36.0',
        start: newLabel,
        zoom: 1
      };

      if (storyDataNode) {
        try {
          storyDataObj = { ...JSON.parse(storyDataNode.data.content || '{}'), start: newLabel };
        } catch (e) {
          console.warn('StoryData estava corrompido. A reescrever ficheiro limpo.');
        }
      }

      let updatedNodes = nds.map(n => {
        let currentTags = Array.isArray(n.data.tags) ? n.data.tags.join(', ') : String(n.data.tags || '');
        let tags = currentTags.replace(/\bstart\b/gi, '').split(',').map(tag => tag.trim()).filter(Boolean).join(', ');

        if (n.id === nodeId) {
          tags = tags ? `${tags}, start` : 'start';
          return { ...n, data: { ...n.data, tags } };
        }
        if (storyDataNode && n.id === storyDataNode.id) {
          return { ...n, data: { ...n.data, content: JSON.stringify(storyDataObj, null, 2), tags: 'secreto' } };
        }
        return { ...n, data: { ...n.data, tags } };
      });

      if (!storyDataNode) {
        updatedNodes.push({
          id: `sd-${Date.now()}`,
          type: 'javascript',
          position: { x: targetNode.position.x, y: targetNode.position.y - 150 },
          data: {
            label: 'StoryData',
            nodeType: 'javascript',
            content: JSON.stringify(storyDataObj, null, 2),
            choices: [],
            tags: 'secreto'
          }
        });
      }
      return updatedNodes;
    });
  }, [setNodes, takeSnapshot]);

  const duplicateNode = useCallback((nodeId) => {
    const nodeToDuplicate = nodesRef.current.find(n => n.id === nodeId);
    if (!nodeToDuplicate) return;

    takeSnapshot();
    const currentNodes = nodesRef.current;
    const numericIds = currentNodes.map(n => parseInt(n.id, 10)).filter(n => !isNaN(n));
    const nextIdNum = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
    const id = String(nextIdNum);

    let baseLabel = nodeToDuplicate.data.label;
    let label = `${baseLabel} Copy`;
    let labelNum = 1;
    const existingLabels = new Set(currentNodes.map(n => n.data.label));
    while (existingLabels.has(label)) {
      label = `${baseLabel} Copy ${++labelNum}`;
    }

    const newNode = {
      id,
      type: nodeToDuplicate.type,
      position: {
        x: (nodeToDuplicate.position?.x || 0) + 40,
        y: (nodeToDuplicate.position?.y || 0) + 40
      },
      ...(nodeToDuplicate.type === 'zone' ? { style: { ...nodeToDuplicate.style } } : {}),
      data: {
        ...nodeToDuplicate.data,
        label,
        choices: [],
        warnings: []
      }
    };

    setNodes(nds => [...nds, newNode]);
    setSelectedNodeId(id);

    // Sync connections if it's a choice node and has content text
    if (nodeToDuplicate.data?.nodeType === 'choice' && nodeToDuplicate.data?.content) {
      setTimeout(() => {
        syncChoicesFromText(id, nodeToDuplicate.data.content);
      }, 0);
    }
  }, [setNodes, takeSnapshot, syncChoicesFromText]);

  const updateSelectedNode = useCallback((patch) => {
    if (!selectedNodeId) return;
    setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, ...patch } } : n));
  }, [selectedNodeId, setNodes]);

  return { addNode, deleteNode, duplicateNode, updateSelectedNode, setStartNode };
}

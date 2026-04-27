import React, { useCallback, useState, useMemo, useEffect } from 'react';
import ReactFlow, { addEdge, MiniMap, Controls, Background, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';

// Lógica
import { parseTwee3, exportToTwee3 } from './utils/tweeParser';
import { buildAdjacencyList } from './utils/graphMath';

// Componentes da Interface
import TopBar from './components/TopBar';
import Inspector from './components/Inspector';
import DataPanel from './components/DataPanel';

const initialNodes = [
  { id: '1', position: { x: 250, y: 5 }, data: { label: 'Start', nodeType: 'choice', content: 'A história começa aqui.', choices: [] } }
];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [counter, setCounter] = useState(2);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  // Cálculos Memorizados
  const adjacencyList = useMemo(() => buildAdjacencyList(nodes, edges), [nodes, edges]);
  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  // Handlers do Grafo
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
  const onNodeClick = useCallback((event, node) => setSelectedNodeId(node.id), []);
  const onEdgeClick = useCallback((event, edge) => { setSelectedEdgeId(edge.id); setSelectedNodeId(null); }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdgeId) {
        setEdges((eds) => eds.filter((ed) => ed.id !== selectedEdgeId));
        setSelectedEdgeId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEdgeId, setEdges]);

  // Funções de Nós e Escolhas
  const addNode = useCallback((type) => {
    const id = String(counter);
    setCounter((c) => c + 1);
    let baseLabel = type === 'javascript' ? 'Script' : type === 'css' ? 'Estilo' : 'Cena';
    let label = baseLabel;
    let labelNum = 1;
    const existingLabels = new Set(nodes.map(n => n.data.label));
    while (existingLabels.has(label)) { labelNum += 1; label = `${baseLabel} ${labelNum}`; }
    setNodes((nds) => nds.concat({ id, position: { x: 200 + (counter % 5) * 80, y: 50 + ((counter / 5) | 0) * 80 }, data: { label, nodeType: type, content: '', choices: [] } }));
    setSelectedNodeId(id);
  }, [counter, setNodes, nodes]);

  const updateSelectedNode = useCallback((patch) => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.map((n) => (n.id === selectedNodeId ? { ...n, data: { ...n.data, ...patch } } : n)));
  }, [selectedNodeId, setNodes]);

  const addChoiceToSelected = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.map((n) => {
      if (n.id !== selectedNodeId) return n;
      const choices = Array.isArray(n.data.choices) ? n.data.choices.slice() : [];
      choices.push({ id: `c-${Date.now()}`, text: 'Nova escolha', target: '' });
      return { ...n, data: { ...n.data, choices } };
    }));
  }, [selectedNodeId, setNodes]);

  const updateChoice = useCallback((choiceId, patch) => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.map((n) => {
      if (n.id !== selectedNodeId) return n;
      return { ...n, data: { ...n.data, choices: (n.data.choices || []).map((c) => (c.id === choiceId ? { ...c, ...patch } : c)) } };
    }));
  }, [selectedNodeId, setNodes]);

  const removeChoice = useCallback((choiceId) => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.map((n) => {
      if (n.id !== selectedNodeId) return n;
      return { ...n, data: { ...n.data, choices: (n.data.choices || []).filter((c) => c.id !== choiceId) } };
    }));
  }, [selectedNodeId, setNodes]);

  const createEdgeFromChoice = useCallback((targetId) => {
      if (!selectedNodeId || !targetId) return;
      setEdges((eds) => eds.concat({ id: `e${selectedNodeId}-${targetId}-${Date.now()}`, source: selectedNodeId, target: targetId }));
  }, [selectedNodeId, setEdges]);

  // Import / Export
  const handleImport = useCallback(() => {
    try {
      const { nodes: newNodes, edges: newEdges } = parseTwee3(importText);
      setNodes(newNodes); setEdges(newEdges);
      setCounter(newNodes.reduce((max, n) => Math.max(max, parseInt(n.id, 10) || 0), 0) + 1);
      setImportError('');
    } catch (e) { setImportError('Failed to parse story.'); }
  }, [importText, setNodes, setEdges]);

  function exportToTwine() {
    const result = exportToTwee3(nodes, edges);
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'plot-in-a-pot.twee';
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: 'Arial, sans-serif', backgroundColor: '#f9f9f9', color: '#111' }}>
      
      {/* REACT FLOW AREA (Centro) */}
      <div style={{ flex: 1, borderRight: '2px solid #ccc', display: 'flex', flexDirection: 'column' }}>
        <TopBar addNode={addNode} />
        <div style={{ flex: 1 }}>
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeDoubleClick={onNodeClick} onEdgeClick={onEdgeClick} fitView selectionOnDrag>
            <MiniMap />
            <Controls />
            <Background gap={16} />
          </ReactFlow>
        </div>
      </div>

      {/* INSPECTOR (Painel Central de Edição) */}
      <Inspector 
        selectedNode={selectedNode} nodes={nodes} updateSelectedNode={updateSelectedNode}
        updateChoice={updateChoice} removeChoice={removeChoice} 
        createEdgeFromChoice={createEdgeFromChoice} addChoiceToSelected={addChoiceToSelected}
      />

      {/* PAINEL DE DADOS (Direita) */}
      <DataPanel 
        exportToTwine={exportToTwine} importText={importText} setImportText={setImportText}
        handleImport={handleImport} importError={importError} adjacencyList={adjacencyList}
      />
      
    </div>
  );
}

export default App;
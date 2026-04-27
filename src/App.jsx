import React, { useCallback, useState, useMemo, useEffect } from 'react';
import ReactFlow, { addEdge, MiniMap, Controls, Background, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';

// Lógica
import { parseTwee3, exportToTwee3 } from './utils/tweeParser';
import { buildAdjacencyList } from './utils/graphMath';
import { validateStoryFlow } from './utils/storyValidator';


// Componentes da Interface
import TopBar from './components/TopBar';
import Inspector from './components/Inspector';
import DataPanel from './components/DataPanel';
import StoryNode from './components/StoryNode';
import SettingsModal from './components/SettingsModal';


const initialNodes = [
  { id: '1', type: 'choice', position: { x: 250, y: 5 }, data: { label: 'Start', nodeType: 'choice', content: 'A história começa aqui.', choices: [] } }
];

const nodeTypes = {
  choice: StoryNode,
  javascript: StoryNode,
  css: StoryNode
};

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [counter, setCounter] = useState(2);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [showAdjacencyList, setShowAdjacencyList] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Cálculos Memorizados
  const adjacencyList = useMemo(() => buildAdjacencyList(nodes, edges), [nodes, edges]);
  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  // Handlers do Grafo
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
  const onNodeClick = useCallback((event, node) => setSelectedNodeId(node.id), []);
  const onEdgeClick = useCallback((event, edge) => { setSelectedEdgeId(edge.id); setSelectedNodeId(null); }, []);

  // --- Gestão de Teclado e Eliminação ---
  const deleteNode = useCallback((nodeIdToRemove) => {
    if (!nodeIdToRemove) return;

    // 1. Remove o nó
    setNodes((nds) => nds.filter((n) => n.id !== nodeIdToRemove));

    // 2. Remove TODAS as arestas ligadas a este nó (entradas e saídas)
    setEdges((eds) => eds.filter((e) => e.source !== nodeIdToRemove && e.target !== nodeIdToRemove));

    // 3. Limpa a seleção
    if (selectedNodeId === nodeIdToRemove) setSelectedNodeId(null);
  }, [selectedNodeId, setNodes, setEdges]);

  const runValidation = () => {
    const errors = validateStoryFlow(nodes, edges);
    setValidationErrors(errors);
    if (errors.length === 0) alert("História consistente! Todos os caminhos são alcançáveis.");
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Proteção: Não apagar se o utilizador estiver a escrever numa caixa de texto
      const activeTag = document.activeElement.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedEdgeId) {
          setEdges((eds) => eds.filter((ed) => ed.id !== selectedEdgeId));
          setSelectedEdgeId(null);
        } else if (selectedNodeId) {
          deleteNode(selectedNodeId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEdgeId, selectedNodeId, setEdges, deleteNode]);

  // Funções de Nós e Escolhas
  const addNode = useCallback((type) => {
    const id = String(counter);
    setCounter((c) => c + 1);
    let baseLabel = type === 'javascript' ? 'Script' : type === 'css' ? 'Estilo' : 'Cena';
    let label = baseLabel;
    let labelNum = 1;
    const existingLabels = new Set(nodes.map(n => n.data.label));
    while (existingLabels.has(label)) { labelNum += 1; label = `${baseLabel} ${labelNum}`; }

    // O objeto formatado para veres bem a raiz
    const newNode = {
      id,
      type, // <-- CRUCIAL: O React Flow olha para aqui para saber que tem de usar o StoryNode
      position: { x: 200 + (counter % 5) * 80, y: 50 + ((counter / 5) | 0) * 80 },
      data: { label, nodeType: type, content: '', choices: [] }
    };

    setNodes((nds) => nds.concat(newNode));
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

  const createEdgeFromChoice = useCallback((choiceId, targetId) => {
    if (!selectedNodeId || !targetId || !choiceId) return;
    const id = `e${selectedNodeId}-${targetId}-${Date.now()}`;
    setEdges((eds) => eds.concat({
      id,
      source: selectedNodeId,
      sourceHandle: choiceId, // <-- Isto liga a seta à escolha exata!
      target: targetId
    }));
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

  const syncChoicesFromText = useCallback((nodeId, text) => {
    const linkRegex = /\[\[(.*?)(?:\||->)(.*?)\]\]|\[\[(.*?)\]\]/g;
    let match;
    const newChoices = [];
    const newEdgesPatch = [];

    while ((match = linkRegex.exec(text))) {
      // Captura: [[Texto|Alvo]] ou [[Texto->Alvo]] ou [[Alvo]]
      const rawText = match[1] || match[3];
      const targetLabel = (match[2] || match[3]).trim();
      const choiceText = rawText.trim();

      const targetNode = nodes.find(n => n.data.label === targetLabel);
      const choiceId = `c-${nodeId}-${targetLabel}-${Date.now()}`;

      newChoices.push({ id: choiceId, text: choiceText, target: targetNode?.id || '' });

      if (targetNode) {
        newEdgesPatch.push({
          id: `e-${nodeId}-${targetNode.id}-${choiceId}`,
          source: nodeId,
          sourceHandle: choiceId,
          target: targetNode.id
        });
      }
    }

    // 1. Atualizar o Nó com as novas escolhas
    setNodes((nds) => nds.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, content: text, choices: newChoices } } : n
    ));

    // 2. Atualizar as Arestas (remover as antigas deste nó e colocar as novas)
    setEdges((eds) => {
      const otherEdges = eds.filter(e => e.source !== nodeId);
      return [...otherEdges, ...newEdgesPatch];
    });
  }, [nodes, setNodes, setEdges]);

  return (
    <div className="flex h-screen w-screen font-sans bg-gray-50 text-gray-900 overflow-hidden">

      {/* SETTINGS MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={{ showAdjacency: showAdjacencyList }}
        toggleSetting={() => setShowAdjacencyList(!showAdjacencyList)}
      />

      {/* REACT FLOW AREA (Centro) */}
      <div className="flex-1 flex flex-col border-r-2 border-gray-300 relative z-0">
        <TopBar addNode={addNode} openSettings={() => setIsSettingsOpen(true)} />
        <div className="flex-1">
          <ReactFlow nodeTypes={nodeTypes} nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeDoubleClick={onNodeClick} onEdgeClick={onEdgeClick} fitView selectionOnDrag>
            <MiniMap className="border-2 border-gray-800 rounded shadow-md" />
            <Controls className="bg-white border-2 border-gray-800 rounded shadow-md" />
            <Background gap={16} color="#cbd5e1" />
          </ReactFlow>
        </div>
      </div>

      {/* INSPECTOR (Painel Central de Edição) */}
      <Inspector
        selectedNode={selectedNode} nodes={nodes} updateSelectedNode={updateSelectedNode}
        updateChoice={updateChoice} removeChoice={removeChoice}
        createEdgeFromChoice={createEdgeFromChoice} addChoiceToSelected={addChoiceToSelected}
        deleteNode={deleteNode}
        syncChoicesFromText={syncChoicesFromText}
      />

      {/* PAINEL DE DADOS (Direita) */}
      <DataPanel
        exportToTwine={exportToTwine} importText={importText} setImportText={setImportText}
        handleImport={handleImport} importError={importError} adjacencyList={adjacencyList}
        showAdjacencyList={showAdjacencyList}
        runValidation={runValidation}
        validationErrors={validationErrors}
      />
    </div>
  );
}

export default App;
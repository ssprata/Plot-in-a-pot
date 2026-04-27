import React, { useCallback, useState, useMemo, useEffect } from 'react';
import ReactFlow, { addEdge, MiniMap, Controls, Background, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';

// Lógica
import { parseTwee3, exportToTwee3 } from './utils/tweeParser';
import { buildAdjacencyList } from './utils/graphMath';
import { validateStoryFlow } from './utils/storyValidator';
import { simulateStoryPlaythrough } from './utils/storySimulator';

// Componentes da Interface
import TopBar from './components/TopBar';
import Inspector from './components/Inspector';
import DataPanel from './components/DataPanel';
import StoryNode from './components/StoryNode';
import SettingsModal from './components/SettingsModal';

const initialNodes = [
  { 
    id: '1', 
    type: 'choice', 
    position: { x: 250, y: 5 }, 
    data: { label: 'Start', nodeType: 'choice', content: 'A história começa aqui.', choices: [], tags: '' } 
  }
];

const nodeTypes = {
  choice: StoryNode,
  javascript: StoryNode,
  css: StoryNode
};

function App() {
  // --- Estados Principais ---
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [counter, setCounter] = useState(2);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  
  // --- Estados de Interface ---
  const [showAdjacencyList, setShowAdjacencyList] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // --- Cálculos Memorizados ---
  const adjacencyList = useMemo(() => buildAdjacencyList(nodes, edges), [nodes, edges]);
  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  // --- Handlers do Grafo ---
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
  const onNodeClick = useCallback((event, node) => setSelectedNodeId(node.id), []);
  const onEdgeClick = useCallback((event, edge) => { setSelectedEdgeId(edge.id); setSelectedNodeId(null); }, []);

  // --- Operações de Nós ---
  const deleteNode = useCallback((nodeIdToRemove) => {
    if (!nodeIdToRemove) return;
    setNodes((nds) => nds.filter((n) => n.id !== nodeIdToRemove));
    setEdges((eds) => eds.filter((e) => e.source !== nodeIdToRemove && e.target !== nodeIdToRemove));
    if (selectedNodeId === nodeIdToRemove) setSelectedNodeId(null);
  }, [selectedNodeId, setNodes, setEdges]);

  const addNode = useCallback((type) => {
    const id = String(counter);
    setCounter((c) => c + 1);
    
    let baseLabel = type === 'javascript' ? 'Script' : type === 'css' ? 'Estilo' : 'Cena';
    let label = baseLabel;
    let labelNum = 1;
    const existingLabels = new Set(nodes.map(n => n.data.label));
    while (existingLabels.has(label)) { labelNum += 1; label = `${baseLabel} ${labelNum}`; }

    const newNode = {
      id,
      type,
      position: { x: 200 + (counter % 5) * 80, y: 50 + ((counter / 5) | 0) * 80 },
      data: { label, nodeType: type, content: '', choices: [], tags: '' }
    };

    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeId(id);
  }, [counter, setNodes, nodes]);

  const updateSelectedNode = useCallback((patch) => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.map((n) => (n.id === selectedNodeId ? { ...n, data: { ...n.data, ...patch } } : n)));
  }, [selectedNodeId, setNodes]);

  const syncChoicesFromText = useCallback((nodeId, text) => {
    const linkRegex = /\[\[(.*?)(?:\||->)(.*?)\]\]|\[\[(.*?)\]\]/g;
    let match;
    const newChoices = [];
    const newEdgesPatch = [];

    while ((match = linkRegex.exec(text))) {
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

    setNodes((nds) => nds.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, content: text, choices: newChoices } } : n
    ));

    setEdges((eds) => {
      const otherEdges = eds.filter(e => e.source !== nodeId);
      return [...otherEdges, ...newEdgesPatch];
    });
  }, [nodes, setNodes, setEdges]);

  // --- Gestão de Teclado ---
  useEffect(() => {
    const handleKeyDown = (e) => {
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

  // --- Ferramentas de Análise ---
  const runValidation = () => {
    const errors = validateStoryFlow(nodes, edges);
    setValidationErrors(errors);
    if (errors.length === 0) alert("História consistente! Todos os caminhos são alcançáveis.");
  };

  const runSimulationLog = () => {
    const report = simulateStoryPlaythrough(nodes, edges);
    console.log("%c --- SIMULAÇÃO DE FLUXO --- ", "background: #222; color: #bada55; font-size: 14px");
    console.log(`Total de Nós: ${report.totalNodes}`);
    console.log(`Nós Alcançáveis: ${report.reachableCount}`);
    if (report.isPerfect) {
      console.log("%c ✅ SUCESSO: Todos os nós são acessíveis!", "color: green; font-weight: bold");
    } else {
      console.error(" ❌ AVISO: Existem nós órfãos ou impossíveis de alcançar:");
      report.unreachableNodes.forEach(name => console.log(`   - ${name}`));
    }
    console.log("----------------------------");
  };

  // --- Import / Export ---
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
    <div className="flex h-screen w-screen font-sans bg-gray-50 text-gray-900 overflow-hidden">
      
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={{ showAdjacency: showAdjacencyList }}
        toggleSetting={() => setShowAdjacencyList(!showAdjacencyList)}
      />

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

      <Inspector
        selectedNode={selectedNode} 
        nodes={nodes} 
        updateSelectedNode={updateSelectedNode}
        deleteNode={deleteNode}
        syncChoicesFromText={syncChoicesFromText}
      />

      <DataPanel
        exportToTwine={exportToTwine} 
        importText={importText} 
        setImportText={setImportText}
        handleImport={handleImport} 
        importError={importError} 
        adjacencyList={adjacencyList}
        showAdjacencyList={showAdjacencyList}
        runValidation={runValidation}
        validationErrors={validationErrors}
        runSimulationLog={runSimulationLog}
      />
    </div>
  );
}

export default App;
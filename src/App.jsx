import React, { useCallback, useState, useMemo, useEffect } from 'react';
import ReactFlow, { addEdge, MiniMap, Controls, Background, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';

// Lógica
import { parseTwee3, exportToTwee3 } from './utils/tweeParser';
import { buildAdjacencyList } from './utils/graphMath';
import { validateStoryFlow } from './utils/storyValidator';
import { runDevSimulationLog } from './utils/storySimulator';

// Componentes da Interface
import TopBar from './components/TopBar';
import Inspector from './components/Inspector';
import DataPanel from './components/DataPanel';
import StoryNode from './components/StoryNode';
import SettingsModal from './components/SettingsModal';
import PlayMode from './components/PlayMode';

// Config
import { loadConfig } from './utils/configLoader';

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

  const getSavedData = () => {
    const saved = localStorage.getItem('plot-in-a-pot-project');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Erro ao carregar dados do LocalStorage", e);
      }
    }
    return null;
  };

function App() {
  const savedData = getSavedData();

  // --- Estados Principais ---
  const [nodes, setNodes, onNodesChange] = useNodesState(savedData?.nodes || initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(savedData?.edges || []);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [isPlayModeOpen, setIsPlayModeOpen] = useState(false);

  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  // 1. Função de Reset Total
  const resetProject = useCallback(() => {
    if (window.confirm("Atenção: Isto apagará todo o progresso atual. Deseja continuar?")) {
      localStorage.removeItem('plot-in-a-pot-project');
      window.location.reload(); // Recarrega a página para estado limpo
    }
  }, []);

  // 2. Autosave limpo (sem counter)
  useEffect(() => {
    const dataToSave = {
      nodes,
      edges,
      version: "1.0"
    };
    localStorage.setItem('plot-in-a-pot-project', JSON.stringify(dataToSave));
  }, [nodes, edges]);

  // --- Estados de Interface ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    const config = loadConfig();
    return {
      showAdjacency: config.showAdjacency,
      showSecrets: config.showSecrets,
      showFlowErrors: config.showFlowErrors,
      showSimulationLegacy: config.showSimulationLegacy
    };
  });

  const toggleSetting = useCallback((key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // --- Estado de Erros de Validação ---
  const [validationErrors, setValidationErrors] = useState([]);

  // --- Cálculos Memorizados ---
  const adjacencyList = useMemo(() => buildAdjacencyList(nodes, edges), [nodes, edges]);
  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  // --- Adiciona a filtragem visual abaixo dos teus useMemos: ---
  const visibleNodes = useMemo(() => {
    if (settings.showSecrets) return nodes;
    return nodes.filter(n => {
      const tags = Array.isArray(n.data.tags) ? n.data.tags.join(' ') : String(n.data.tags || "");
      return !tags.toLowerCase().includes('secreto');
    });
  }, [nodes, settings.showSecrets]);

  const visibleEdges = useMemo(() => {
    if (settings.showSecrets) return edges;
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    return edges.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
  }, [edges, visibleNodes, settings.showSecrets]);

  // --- Sync choices from text (must be above onConnect!) ---
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

  // --- Handlers do Grafo ---
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds));
    setNodes((nds) => nds.map((n) => {
      if (n.id === params.source) {
        const targetNode = nds.find(nd => nd.id === params.target);
        if (!targetNode) return n;
        const targetLabel = targetNode.data.label;
        const linkSyntax = `[[${targetLabel}]]`;
        let content = n.data.content || "";
        // Only add if not already present
        if (!content.includes(linkSyntax)) {
          // Add a newline if needed
          if (content.length > 0 && !content.endsWith('\n')) content += '\n';
          content += linkSyntax;
        }
        // Call syncChoicesFromText to update choices
        setTimeout(() => syncChoicesFromText(n.id, content), 0);
        return { ...n, data: { ...n.data, content } };
      }
      return n;
    }));
  }, [setEdges, setNodes, syncChoicesFromText]);
  const onNodeClick = useCallback((event, node) => setSelectedNodeId(node.id), []);
  const onEdgeClick = useCallback((event, edge) => { setSelectedEdgeId(edge.id); setSelectedNodeId(null); }, []);

  // --- Operações de Nós ---
  const deleteNode = useCallback((nodeIdToRemove) => {
    if (!nodeIdToRemove) return;
    setNodes((nds) => nds.filter((n) => n.id !== nodeIdToRemove));
    setEdges((eds) => eds.filter((e) => e.source !== nodeIdToRemove && e.target !== nodeIdToRemove));
    if (selectedNodeId === nodeIdToRemove) setSelectedNodeId(null);
  }, [selectedNodeId, setNodes, setEdges]);
  const addNode = useCallback((type, presetLabel = null, presetTags = '') => {
    if (presetLabel) {
      const existingNode = nodes.find(n => n.data.label.toLowerCase() === presetLabel.toLowerCase());
      if (existingNode) {
        alert(`O no especial "${presetLabel}" ja existe no projeto.`);
        setSelectedNodeId(existingNode.id);
        return;
      }
    }

    // Gerador dinâmico de ID baseado no nó com número mais alto
    const numericIds = nodes.map(n => parseInt(n.id, 10)).filter(n => !isNaN(n));
    const nextIdNum = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
    const id = String(nextIdNum);

    let label = presetLabel;

    if (!label) {
      let baseLabel = type === 'javascript' ? 'Script' : type === 'css' ? 'Estilo' : 'Cena';
      label = baseLabel;
      let labelNum = 1;
      const existingLabels = new Set(nodes.map(n => n.data.label));
      while (existingLabels.has(label)) { labelNum += 1; label = `${baseLabel} ${labelNum}`; }
    }

    // Posição calculada com base no número total de nós atuais
    const offset = nodes.length;
    const newNode = {
      id,
      type,
      position: { x: 200 + (offset % 5) * 80, y: 50 + ((offset / 5) | 0) * 80 },
      data: { label, nodeType: type, content: '', choices: [], tags: presetTags }
    };

    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeId(id);
  }, [nodes, setNodes]);

  const setStartNode = useCallback((nodeId) => {
    const targetNode = nodes.find(n => n.id === nodeId);
    if (!targetNode) return;

    const newLabel = targetNode.data.label;

    setNodes(nds => {
      let storyDataNode = nds.find(n => n.data.label.toLowerCase() === 'storydata');

      let storyDataObj = {
        ifid: crypto.randomUUID ? crypto.randomUUID() : "F3F82260-1419-48CB-B1DC-2C3C56D7324B",
        format: "SugarCube",
        "format-version": "2.36.0",
        start: newLabel,
        zoom: 1
      };

      if (storyDataNode) {
        try {
          storyDataObj = { ...JSON.parse(storyDataNode.data.content || "{}"), start: newLabel };
        } catch (e) {
          console.warn("StoryData estava corrompido. A reescrever ficheiro limpo.");
        }
      }

      let updatedNodes = nds.map(n => {
        // CORREÇÃO: Converter as tags para String garantidamente, quer venham do Parser (Array) ou do Inspector (String)
        let currentTags = Array.isArray(n.data.tags) ? n.data.tags.join(', ') : String(n.data.tags || "");

        let tags = currentTags.replace(/\bstart\b/gi, '').split(',').map(t => t.trim()).filter(t => t).join(', ');

        if (n.id === nodeId) {
          tags = tags ? `${tags}, start` : 'start';
          return { ...n, data: { ...n.data, tags } };
        }
        if (storyDataNode && n.id === storyDataNode.id) {
          // Garante que se o StoryData for atualizado, recebe a tag secreto
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
  }, [nodes, setNodes]);

  const updateSelectedNode = useCallback((patch) => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.map((n) => (n.id === selectedNodeId ? { ...n, data: { ...n.data, ...patch } } : n)));
  }, [selectedNodeId, setNodes]);

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
    // A função runDevSimulationLog já trata de todo o agrupamento e formatação
    // na consola. Basta chamá-la e passar os dados do grafo.
    runDevSimulationLog(nodes, edges);
  };

  // --- Import / Export ---
  const handleImport = useCallback(() => {
    try {
      const { nodes: newNodes, edges: newEdges } = parseTwee3(importText);

      // Lista de nós de sistema oficiais do Twine
      const systemNodes = ['storyinit', 'storytitle', 'storydata', 'storycaption'];

      const formattedNodes = newNodes.map(n => {
        // 1. Uniformizar o formato das tags para o nosso editor
        let tags = Array.isArray(n.data.tags) ? n.data.tags.join(', ') : String(n.data.tags || "");

        // 2. Se for um nó de sistema e não tiver a tag secreto, adicionamos nós mesmos
        if (systemNodes.includes(n.data.label.toLowerCase()) && !tags.includes('secreto')) {
          tags = tags ? `${tags}, secreto` : 'secreto';
        }

        return { ...n, data: { ...n.data, tags } };
      });

      setNodes(formattedNodes);
      setEdges(newEdges);
      setImportError('');
    } catch (e) {
      setImportError('Failed to parse story.');
    }
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
    <div className="flex h-screen w-screen font-sans bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 overflow-hidden">

      <PlayMode 
        isOpen={isPlayModeOpen} 
        onClose={() => setIsPlayModeOpen(false)} 
        nodes={nodes} 
        edges={edges} 
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        toggleSetting={toggleSetting}
        resetProject={resetProject}
      />

      <div className="flex-1 flex flex-col border-r-2 border-gray-300 relative z-0">
        <TopBar addNode={addNode} openSettings={() => setIsSettingsOpen(true)} openPlayMode={() => setIsPlayModeOpen(true)}/>
        <div className="flex-1">
          {/* AQUI: Usar visibleNodes e visibleEdges para que o filtro funcione visualmente */}
          <ReactFlow
            nodeTypes={nodeTypes}
            nodes={visibleNodes}
            edges={visibleEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDoubleClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            fitView
            selectionOnDrag
          >
            <MiniMap className="border-2 border-gray-800 dark:border-gray-200 rounded shadow-md dark:shadow-lg" />
            <Controls className="bg-white dark:bg-gray-800 border-2 border-gray-800 dark:border-gray-200 rounded shadow-md dark:shadow-lg" />
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
        setStartNode={setStartNode}
      />

      <DataPanel
        exportToTwine={exportToTwine}
        importText={importText}
        setImportText={setImportText}
        handleImport={handleImport}
        importError={importError}
        adjacencyList={adjacencyList}
        showAdjacencyList={settings.showAdjacency}
        showFlowErrors={settings.showFlowErrors}
        runValidation={runValidation}
        validationErrors={validationErrors}
        runSimulationLog={runSimulationLog}
        showSimulationLegacy={settings.showSimulationLegacy}
      />
    </div>
  );
}

export default App;
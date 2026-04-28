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

  const addNode = useCallback((type, presetLabel = null, presetTags = '') => {
    // Verificar se é um nó especial que já existe
    if (presetLabel) {
      const existingNode = nodes.find(n => n.data.label.toLowerCase() === presetLabel.toLowerCase());
      if (existingNode) {
        alert(`O no especial "${presetLabel}" ja existe no projeto.`);
        setSelectedNodeId(existingNode.id);
        return;
      }
    }

    const id = String(counter);
    setCounter((c) => c + 1);

    let label = presetLabel;

    // Se não houver preset, gera o nome padrao (Cena 1, Script 2, etc.)
    if (!label) {
      let baseLabel = type === 'javascript' ? 'Script' : type === 'css' ? 'Estilo' : 'Cena';
      label = baseLabel;
      let labelNum = 1;
      const existingLabels = new Set(nodes.map(n => n.data.label));
      while (existingLabels.has(label)) { labelNum += 1; label = `${baseLabel} ${labelNum}`; }
    }

    const newNode = {
      id,
      type,
      position: { x: 200 + (counter % 5) * 80, y: 50 + ((counter / 5) | 0) * 80 },
      data: { label, nodeType: type, content: '', choices: [], tags: presetTags }
    };

    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeId(id);
  }, [counter, setNodes, nodes]);

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

  const syncChoicesFromText = useCallback((nodeId, text) => {
    const linkRegex = /\[\[(.*?)(?:\||->)(.*?)\]\]|\[\[(.*?)\]\]/g;
    let match;
    const newChoices = [];
    const newEdgesPatch = [];

    // O SEGREDO ESTÁ AQUI: Usar um contador sequencial em vez de texto dinâmico.
    let choiceCounter = 1;

    while ((match = linkRegex.exec(text))) {
      const rawText = match[1] || match[3];
      const targetLabel = (match[2] || match[3]).trim();
      const choiceText = rawText.trim();

      const targetNode = nodes.find(n => n.data.label.toLowerCase() === targetLabel.toLowerCase());

      // ID imutável baseado na posição do link dentro do texto (ex: c-9-1, c-9-2)
      const choiceId = `c-${nodeId}-${choiceCounter++}`;

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
    // 2. Apaga o console.log antigo que tinhas aqui dentro.
    // Agora, apenas chamamos o motor de simulação de desenvolvimento.
    // A função internamente vai encarregar-se de agrupar e imprimir os dados na consola.
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
      setCounter(formattedNodes.reduce((max, n) => Math.max(max, parseInt(n.id, 10) || 0), 0) + 1);
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

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        toggleSetting={toggleSetting}
      />

      <div className="flex-1 flex flex-col border-r-2 border-gray-300 relative z-0">
        <TopBar addNode={addNode} openSettings={() => setIsSettingsOpen(true)} />
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
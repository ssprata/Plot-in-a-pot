import React, { useCallback, useState, useMemo, useEffect } from 'react';
import ReactFlow, { addEdge, MiniMap, Controls, Background, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import { flushSync } from 'react-dom';

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
import AiImportModal from './components/AiImportModal';
import Popout from './components/Popout';
import { InfoPopoutProvider } from './contexts/InfoPopoutContext';
import { useTranslation } from 'react-i18next';

// Hotkey
import { useTheme } from './contexts/ThemeContext';
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
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const savedData = getSavedData();

  // --- Estados Principais ---
  const [nodes, setNodes, onNodesChange] = useNodesState(savedData?.nodes || initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(savedData?.edges || []);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [isPlayModeOpen, setIsPlayModeOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [parserWarnings, setParserWarnings] = useState([]);
  const [validationResult, setValidationResult] = useState(null);

  // 1. Função de Reset Total
  const resetProject = useCallback(() => {
    if (window.confirm(t('alerts.resetConfirm', 'Warning: This will delete all current progress. Continue?'))) {
      localStorage.removeItem('plot-in-a-pot-project');
      window.location.reload(); // Recarrega a página para estado limpo
    }
  }, [t]);

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

  const [infoPopout, setInfoPopout] = useState({
    isOpen: false,
    title: 'Informações',
    subtitle: '',
    content: null
  });

  const showInfoPopout = useCallback(({ title, subtitle, content }) => {
    setInfoPopout({
      isOpen: true,
      title,
      subtitle,
      content
    });
  }, []);

  const closeInfoPopout = useCallback(() => {
    setInfoPopout((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleAiImportSuccess = useCallback((tweeText) => {
    try {
      const { nodes: newNodes, edges: newEdges } = parseTwee3(tweeText);
      const systemNodes = ['storyinit', 'storytitle', 'storydata', 'storycaption'];

      const formattedNodes = newNodes.map(n => {
        let tags = Array.isArray(n.data.tags) ? n.data.tags.join(', ') : String(n.data.tags || "");
        if (systemNodes.includes(n.data.label.toLowerCase()) && !tags.includes('secreto')) {
          tags = tags ? `${tags}, secreto` : 'secreto';
        }
        return { ...n, data: { ...n.data, tags } };
      });

      // Atualiza o estado da aplicação com a nova história
      setNodes(formattedNodes);
      setEdges(newEdges);

      // Feedback visual
      alert(t('alerts.aiSuccess', 'AI generated your story successfully!'));
    } catch (e) {
      alert(t('alerts.aiInvalid', 'AI returned invalid output. Please try again.'));
      console.error(e);
    }
  }, [setNodes, setEdges]);

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

  const syncChoicesFromText = useCallback((nodeId, text) => {
    const localWarnings = [];
    const newChoices = [];
    const newEdgesPatch = [];
    let choiceIndex = 0;

    // Snapshot atual dos nós (leitura síncrona, sem closure stale)
    const currentNodes = nodes;

    // --- PADRÃO 1: Links normais do Twine [[Texto|Destino]] ou [[Destino]] ---
    const linkRegex = /\[\[(.*?)(?:\||->)(.*?)\]\]|\[\[(.*?)\]\]/g;
    let match;

    while ((match = linkRegex.exec(text))) {
      const rawText = match[1] || match[3];
      const targetLabel = (match[2] || match[3]).trim();
      const choiceText = rawText.trim();

      if (
        targetLabel.startsWith('$') ||
        targetLabel.startsWith('_') ||
        targetLabel.match(/[\(\)\+\-\*\/\=]/)
      ) {
        localWarnings.push(
          `A ligação para "${targetLabel}" foi bloqueada. Não uses variáveis no destino.`
        );
        continue;
      }

      const targetNode = currentNodes.find(n => n.data.label === targetLabel);

      // ID estável: baseado no nó de origem, destino e posição na lista
      const safeTarget = targetLabel.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '');
      const choiceId = `c-${nodeId}-${safeTarget}-${choiceIndex++}`;

      newChoices.push({
        id: choiceId,
        text: choiceText,
        target: targetNode?.id || ''
      });

      if (targetNode) {
        newEdgesPatch.push({
          id: `e-${nodeId}-${targetNode.id}-${choiceId}`,
          source: nodeId,
          sourceHandle: choiceId,
          target: targetNode.id
        });
      }
    }

    // --- PADRÃO 2: Macros do SugarCube <<link "Texto">><<goto "Destino">><</link>> ---
    const macroLinkRegex = /<<link\s+"([^"]+)"\s*>>([\s\S]*?)<<\/link>>/g;
    let macroMatch;

    while ((macroMatch = macroLinkRegex.exec(text))) {
      const choiceText = macroMatch[1].trim();
      const innerContent = macroMatch[2];

      const gotoRegex = /<<goto\s+(?:"([^"]+)"|'([^']+)'|([^>\s]+))\s*>>/;
      const gotoMatch = gotoRegex.exec(innerContent);
      const gotoTarget = gotoMatch
        ? (gotoMatch[1] || gotoMatch[2] || gotoMatch[3])
        : null;

      const variavelDestinoRegex =
        /<<set\s+\$(?:passagem_retorno|proximo_destino)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^>\s]+))\s*>>/;
      const variavelMatch = variavelDestinoRegex.exec(innerContent);
      const varTarget = variavelMatch
        ? (variavelMatch[1] || variavelMatch[2] || variavelMatch[3])
        : null;

      let targetTitleRaw = varTarget || gotoTarget;
      if (targetTitleRaw) targetTitleRaw = targetTitleRaw.trim();

      if (!targetTitleRaw) continue;

      if (targetTitleRaw.startsWith('$') || targetTitleRaw.startsWith('_')) {
        localWarnings.push(
          `O macro <<goto>> para "${targetTitleRaw}" foi bloqueado. Não uses variáveis no destino.`
        );
        continue;
      }

      const targetNode = currentNodes.find(n => n.data.label === targetTitleRaw);

      const safeTarget = targetTitleRaw.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '');
      const choiceId = `c-${nodeId}-${safeTarget}-${choiceIndex++}`;

      newChoices.push({
        id: choiceId,
        text: choiceText,
        target: targetNode?.id || ''
      });

      if (targetNode) {
        newEdgesPatch.push({
          id: `e-${nodeId}-${targetNode.id}-${choiceId}`,
          source: nodeId,
          sourceHandle: choiceId,
          target: targetNode.id
        });
      }
    }

    // --- Aplicação atómica: choices primeiro, edges depois ---
    // flushSync garante que os Handles já estão no DOM antes do React Flow
    // tentar desenhar as arestas, evitando o erro #008.
    flushSync(() => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, content: text, choices: newChoices, warnings: localWarnings } }
            : n
        )
      );
    });

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

  // Função para adicionar um novo nó ao grafo
  const addNode = useCallback((type, presetLabel = null, presetTags = '') => {
    // 1. Prevenção de duplicados para nós de sistema
    if (presetLabel) {
      const existingNode = nodes.find(n => n.data.label.toLowerCase() === presetLabel.toLowerCase());
      if (existingNode) {
        // Se já existir, avisa o utilizador (com tradução) e foca nesse nó
        alert(t('alerts.specialNodeExists', `O nó especial "${presetLabel}" já existe no projeto.`));
        setSelectedNodeId(existingNode.id);
        return;
      }
    }

    // 2. Geração dinâmica de um ID numérico sequencial
    const numericIds = nodes.map(n => parseInt(n.id, 10)).filter(n => !isNaN(n));
    const nextIdNum = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
    const id = String(nextIdNum);

    let label = presetLabel;

    // 3. Atribuição de um nome padrão (ex: "Cena 1", "Script 2") se não for fornecido um
    if (!label) {
      let baseLabel = type === 'javascript'
        ? 'Script'
        : type === 'css'
          ? t('topBar.nodeLabels.style')
          : t('topBar.nodeLabels.scene');
      
      label = baseLabel;
      let labelNum = 1;
      const existingLabels = new Set(nodes.map(n => n.data.label));
      
      // Incrementa o número até encontrar um nome que não exista no grafo
      while (existingLabels.has(label)) { 
        labelNum += 1; 
        label = `${baseLabel} ${labelNum}`; 
      }
    }

    // 4. Cálculo da posição inicial do nó no ecrã para evitar sobreposições
    const offset = nodes.length;
    const newNode = {
      id,
      type,
      position: { x: 200 + (offset % 5) * 80, y: 50 + ((offset / 5) | 0) * 80 },
      data: { label, nodeType: type, content: '', choices: [], tags: presetTags }
    };

    // 5. Atualização do estado para desenhar o nó e selecioná-lo imediatamente
    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeId(id);
    
  // CORREÇÃO: Removemos a variável 'language' daqui, mantendo apenas o que ainda usamos
  }, [nodes, setNodes, t]);

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

  const runValidation = () => {
    const result = validateStoryFlow(nodes, edges);
    setValidationErrors(result.unreachableEdges);
    setValidationResult(result);

    if (result.unreachableEdges.length === 0 && result.orphanNodes.length === 0 && result.hasReachableEnd) {
      const endLabels = result.reachableEndNodes.map(n => n.label).join(', ');
      alert(
        t('alerts.validationSuccess')
          .replace('{count}', String(result.reachableEndNodes.length))
          .replace('{ends}', endLabels)
      );
    } else if (result.unreachableEdges.length === 0 && result.orphanNodes.length === 0 && !result.hasReachableEnd) {
      alert(t('alerts.validationNoEnd'));
    }
  };

  const runSimulationLog = () => {
    // A função runDevSimulationLog já trata de todo o agrupamento e formatação
    // na consola. Basta chamá-la e passar os dados do grafo.
    runDevSimulationLog(nodes, edges);
  };

  // --- Import / Export ---
  const handleImport = useCallback(() => {
    try {
      console.log("1. A iniciar importação...");

      // Extrai explicitamente a propriedade 'warnings' que o parser devolve
      const { nodes: newNodes, edges: newEdges, warnings } = parseTwee3(importText);

      console.log("2. O Parser devolveu estes avisos:", warnings);

      // Lista de nós de sistema oficiais do Twine
      const systemNodes = ['storyinit', 'storytitle', 'storydata', 'storycaption'];

      const formattedNodes = newNodes.map(n => {
        let tags = Array.isArray(n.data.tags) ? n.data.tags.join(', ') : String(n.data.tags || "");
        if (systemNodes.includes(n.data.label.toLowerCase()) && !tags.includes('secreto')) {
          tags = tags ? `${tags}, secreto` : 'secreto';
        }
        return { ...n, data: { ...n.data, tags } };
      });

      setNodes(formattedNodes);
      setEdges(newEdges);

      // Se não houver avisos, garantimos que passa um array vazio em vez de "undefined"
      const avisosParaOEcran = warnings || [];
      console.log("3. A enviar para o ecrã:", avisosParaOEcran);

      setParserWarnings(avisosParaOEcran);
      setImportError('');

    } catch (e) {
      console.error("Erro fatal na importação:", e);
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

  // --- Barreira de Segurança do Modo Jogador ---
  const handleOpenPlayMode = useCallback(() => {
    // Procura no array se ALGUÉM tem a lista de avisos preenchida
    const hasSyntaxErrors = nodes.some(node => node.data.warnings && node.data.warnings.length > 0);

    if (hasSyntaxErrors) {
      alert(t('alerts.playModeBlocked'));
      return;
    }

    // Se estiver tudo limpo, abre o modal normalmente
    setIsPlayModeOpen(true);
  }, [nodes]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // We don't want hotkeys triggering while the user is typing story text or names!
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // -- ORIGINAL HOTKEYS --
      // Ctrl + P : Toggle Play Mode
      if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleOpenPlayMode();
      }
      // Ctrl + I : Toggle AI Import
      else if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setIsAiModalOpen(prev => !prev);
      }
      // Ctrl + X : Add standard Choice Node
      else if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        addNode('choice');
      }
      // Ctrl + , : Toggle Settings
      else if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen(prev => !prev);
      }
      // Escape : Close all modals and popouts safely
      else if (e.key === 'Escape') {
        setIsPlayModeOpen(false);
        setIsAiModalOpen(false);
        setIsSettingsOpen(false);
        closeInfoPopout();
      }
      // Ctrl + S : Add Script Node
      else if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        addNode('javascript');
      }
      // Ctrl + E : Add Estilo (CSS) Node
      else if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        addNode('css');
      }
      // Ctrl + V : Run Validation
      else if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        if (runValidation) runValidation();
      }
      // Ctrl + M : Toggle Light/Night Mode
      else if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        // Broadcast a custom event to any component listening
        window.dispatchEvent(new Event('triggerThemeToggle'));
      }
      // --System Nodes Hotkeys (with Ctrl + Alt)--
      // Ctrl + Alt + D : Add StoryData
      else if (e.ctrlKey && !e.shiftKey && e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        addNode('choice', 'StoryData', 'secreto');
      }
      // Ctrl + Alt + T : Add StoryTitle
      else if (e.ctrlKey && !e.shiftKey && e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        addNode('choice', 'StoryTitle', 'secreto');
      }
      // Ctrl + Alt + I : Add StoryInit (Because Ctrl + I is AI Import!)
      else if (e.ctrlKey && !e.shiftKey && e.altKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        addNode('choice', 'StoryInit', 'secreto');
      }
      // Ctrl + Alt + C : Add StoryCaption
      else if (e.ctrlKey && !e.shiftKey && e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        addNode('choice', 'StoryCaption', 'secreto');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addNode, closeInfoPopout, handleOpenPlayMode]); // Important dependencies so React doesn't use stale state

  // Listen for custom theme toggle event (Ctrl+M)
  useEffect(() => {
    const handler = () => toggleTheme();
    window.addEventListener('triggerThemeToggle', handler);
    return () => window.removeEventListener('triggerThemeToggle', handler);
  }, [toggleTheme]);

  return (
    <InfoPopoutProvider value={{ showInfoPopout, closeInfoPopout }}>
      <div className="flex h-screen w-screen font-sans bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 overflow-hidden">

        <AiImportModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          onImportSuccess={handleAiImportSuccess}
        />

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
          <TopBar addNode={addNode} openSettings={() => setIsSettingsOpen(true)} openPlayMode={() => handleOpenPlayMode()} openAiModal={() => setIsAiModalOpen(true)} />
          <div className="flex-1">
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
              <MiniMap
                className="border-2 border-gray-800 dark:border-gray-200 rounded shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]"
                nodeColor={isDark ? '#4b5563' : '#e2e8f0'} // Cor dos nós no mapa (cinza escuro vs claro)
                maskColor={isDark ? 'rgba(17, 24, 39, 0.75)' : 'rgba(240, 242, 243, 0.7)'} // Sombra fora da visão
                style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }} // Fundo geral do mapa
              />

              <Controls
                className="border-2 border-gray-800 dark:border-gray-200 rounded shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] overflow-hidden [&>button]:dark:bg-gray-800 [&>button]:dark:border-gray-700 [&>button]:dark:fill-gray-200 hover:[&>button]:dark:bg-gray-700 [&>button]:transition-colors"
              />

              <Background
                gap={16}
                color={isDark ? "#475569" : "#cbd5e1"} // Cor dos pontos/linhas de fundo
              />
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
          validationResult={validationResult}
          parserWarnings={parserWarnings}
          validationErrors={validationErrors}
          runSimulationLog={runSimulationLog}
          showSimulationLegacy={settings.showSimulationLegacy}
        />

        <Popout
          isOpen={infoPopout.isOpen}
          onClose={closeInfoPopout}
          title={infoPopout.title}
          subtitle={infoPopout.subtitle}
        >
          {infoPopout.content}
        </Popout>
      </div>
    </InfoPopoutProvider>
  );
}

export default App;
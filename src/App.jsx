// src/App.jsx
import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
// CORREGIDO: Importada a função 'updateEdge' nativa para evitar o erro no-undef de reencaminhamento
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  updateEdge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { flushSync } from 'react-dom';

// Utilitários de Lógica e Parsing
import { parseTwee3, exportToTwee3 } from './utils/tweeParser';
import { buildAdjacencyList } from './utils/graphMath';
import { validateStoryFlow } from './utils/storyValidator';
import { runDevSimulationLog } from './utils/storySimulator';

// Componentes da Interface Geral
import EditableEdge from './components/EditableEdge';
import TopBar from './components/TopBar';
import Inspector from './components/Inspector';
import DataPanel from './components/DataPanel';
import StoryNode from './components/StoryNode';
import SettingsModal from './components/SettingsModal';
import PlayMode from './components/PlayMode';
import AiImportModal from './components/AiImportModal';
import Popout from './components/Popout';
import TranslationMatrix from './components/TranslationMatrix';
import ExportModal from './components/ExportModal';
import VariablesModal from './components/VariablesModal';
import ConnectionModal from './components/ConnectionModal';
import { InfoPopoutProvider } from './contexts/InfoPopoutContext';
import { useTranslation } from 'react-i18next';
import TemplatePromptModal from './components/TemplatePromptModal';

// Contexto de Tema e Carregamento de Configurações
import { useTheme } from './contexts/ThemeContext';
import { loadConfig } from './utils/configLoader';

// --- HELPERS PARA VARIÁVEIS (Regex SugarCube) ---
const parseVariablesFromText = (text = '') => {
  const vars = {};
  const regex = /<<set\s+\$([\w\d]+)\s*(?:to|=)\s*(.*?)>>/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    vars[match[1]] = match[2].trim();
  }
  return vars;
};



// Nó de inicialização padrão caso o armazenamento local esteja vazio
const initialNodes = [
  {
    id: '1',
    type: 'choice',
    position: { x: 250, y: 5 },
    data: { label: 'Start', nodeType: 'choice', content: 'A história começa aqui.', choices: [], tags: '' }
  }
];

// Mapeamento de tipos de nós customizados para renderização no grafo do ReactFlow
const nodeTypes = {
  choice: StoryNode,
  javascript: StoryNode,
  css: StoryNode
};

const edgeTypes = {
  editable: EditableEdge
};

// Função utilitária para extrair e fazer o parse seguro dos dados guardados no browser
const getSavedData = () => {
  const saved = localStorage.getItem('plot-in-a-pot-project');
  if (saved && saved !== 'undefined') {
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
  const savedData = useMemo(() => getSavedData(), []);

  // --- Estados Principais ---
  const [nodes, setNodes, onNodesChange] = useNodesState(
    Array.isArray(savedData?.nodes) ? savedData.nodes : initialNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(savedData?.edges || []);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [isPlayModeOpen, setIsPlayModeOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [importText, setImportText] = useState('');

  // --- ESTADO DOS MODAIS DE TRADUÇÃO E EXPORTAÇÃO ---
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // --- ESTADO DO MODAL DE VARIÁVEIS ---
  const [isVarModalOpen, setIsVarModalOpen] = useState(false);

  // --- ESTADO DO MODAL DE LIGAÇÃO ---
  const [pendingConnection, setPendingConnection] = useState(null); // { source, target } | null

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  useEffect(() => {
    const getCookie = (name) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      if (match) return match[2];
      return null;
    };
    const seenPrompt = getCookie('seen-template-prompt');
    if (seenPrompt === 'false' || seenPrompt === null) {
      setIsTemplateModalOpen(true);
    }
  }, []);

  const [importError, setImportError] = useState('');
  const [parserWarnings, setParserWarnings] = useState([]);
  const [validationResult, setValidationResult] = useState(null);

  // --- ESTADOS DO HISTÓRICO (UNDO / REDO) ---
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  // Inicialização do estado que agora lê e persiste a base de dados de localização do LocalStorage
  const [translations, setTranslations] = useState({
    languages: savedData?.translations?.languages || ['pt', 'en'],
    keys: savedData?.translations?.keys || {}
  });

  // 1. Função de Reset Total do Espaço de Trabalho
  const resetProject = useCallback(() => {
    if (window.confirm(t('alerts.resetConfirm', 'Warning: This will delete all current progress. Continue?'))) {
      localStorage.removeItem('plot-in-a-pot-project');
      window.location.reload();
    }
  }, [t]);

  // 2. Gancho de Auto-Save Atómico sincronizado com o grafo e tabelas de chaves
  useEffect(() => {
    const dataToSave = {
      nodes,
      edges,
      translations,
      version: "1.0"
    };
    localStorage.setItem('plot-in-a-pot-project', JSON.stringify(dataToSave));
  }, [nodes, edges, translations]);

  // Sincroniza dinamicamente as novas chaves injetadas no motor global do i18next
  useEffect(() => {
    translations.languages.forEach(lang => {
      if (!i18n.hasResourceBundle(lang, 'translation')) {
        i18n.addResourceBundle(lang, 'translation', translations.keys);
      }
    });
  }, [translations, i18n]);

  // --- Estados de Interface ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    const config = loadConfig();
    return {
      showAdjacency: config.showAdjacency,
      showSecrets: config.showSecrets,
      showFlowErrors: config.showFlowErrors,
      showSimulationLegacy: config.showSimulationLegacy,
      visualLogicEnabled: config.visualLogicEnabled !== false
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

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  const takeSnapshot = useCallback(() => {
    setPast(prev => [...prev.slice(-50), {
      nodes: JSON.parse(JSON.stringify(nodesRef.current)),
      edges: JSON.parse(JSON.stringify(edgesRef.current))
    }]);
    setFuture([]);
  }, []); // ← sem dependências, nunca recria

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    const currentNodes = JSON.parse(JSON.stringify(nodes));
    const currentEdges = JSON.parse(JSON.stringify(edges));
    setFuture((prev) => [{ nodes: currentNodes, edges: currentEdges }, ...prev]);

    setPast(newPast);
    setNodes(previous.nodes);
    setEdges(previous.edges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [past, nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);

    const currentNodes = JSON.parse(JSON.stringify(nodes));
    const currentEdges = JSON.parse(JSON.stringify(edges));
    setPast((prev) => [...prev.slice(-50), { nodes: currentNodes, edges: currentEdges }]);

    setFuture(newFuture);
    setNodes(next.nodes);
    setEdges(next.edges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [future, nodes, edges, setNodes, setEdges]);

  // Processa o retorno textual do gerador de Inteligência Artificial para nós do grafo
  const handleAiImportSuccess = useCallback((tweeText) => {
    try {
      takeSnapshot();
      const { nodes: newNodes, edges: newEdges } = parseTwee3(tweeText);
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

      alert(t('alerts.aiSuccess', 'AI generated your story successfully!'));
    } catch (e) {
      alert(t('alerts.aiInvalid', 'AI returned invalid output. Please try again.'));
      console.error(e);
    }
  }, [setNodes, setEdges, t, takeSnapshot]);

  const toggleSetting = useCallback((key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // --- Estado de Erros de Validação ---
  const [validationErrors, setValidationErrors] = useState([]);

  // --- Cálculos Memorizados do Ciclo do Grafo ---
  const adjacencyList = useMemo(() => buildAdjacencyList(nodes ?? [], edges ?? []), [nodes, edges]);
  const selectedNode = useMemo(() => (nodes ?? []).find((n) => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  // --- LÓGICA DE GESTÃO DE VARIÁVEIS ---
  const globalVars = useMemo(() => {
    return (nodes ?? []).reduce((acc, node) => {
      const vars = parseVariablesFromText(node.data.content);
      return { ...acc, ...vars };
    }, {});
  }, [nodes]);

  const [varModalMode, setVarModalMode] = useState('create');

  const openVariablesEditor = useCallback(() => {
    if (!selectedNode) return;
    setVarModalMode('create');
    setIsVarModalOpen(true);
  }, [selectedNode]);

  const openChangeVariablesEditor = useCallback(() => {
    if (!selectedNode) return;
    setVarModalMode('change');
    setIsVarModalOpen(true);
  }, [selectedNode]);


  // Filtragem visual para ocultar nós marcados com a tag "secreto" no modo de visualização normal
  const visibleNodes = useMemo(() => {
    if (settings.showSecrets) return nodes;
    return nodes.filter(n => {
      const tags = Array.isArray(n.data.tags) ? n.data.tags.join(' ') : String(n.data.tags || "");
      return !tags.toLowerCase().includes('secreto');
    });
  }, [nodes, settings.showSecrets]);

  const visibleEdges = useMemo(() => {
    if (settings.showSecrets) return edges;
    const ids = new Set(visibleNodes.map(n => n.id));
    return edges.filter(e => ids.has(e.source) && ids.has(e.target));
  }, [edges, visibleNodes, settings.showSecrets]);

  // Sincroniza as escolhas de navegação e as arestas analisando o texto em tempo real (Padrões Twine e SugarCube)
  const syncChoicesFromText = useCallback((nodeId, text) => {
    const localWarnings = [];
    const newChoices = [];
    const newEdgesPatch = [];
    let choiceIndex = 0;

    const currentNodes = nodes;

    // --- PADRÃO 1: Links normais do Twine ---
    const linkRegex = /\[\[(.*?)(?:\||->)(.*?)\]\]|\[\[(.*?)\]\]/g;
    let match;

    while ((match = linkRegex.exec(text))) {
      const rawText = match[1] || match[3];
      const targetLabel = (match[2] || match[3]).trim();
      let choiceText = rawText.trim();

      const translationMatch = choiceText.match(/^t\(['"]([^'"]+)['"]\)$/);
      if (translationMatch) {
        choiceText = translationMatch[1];
      }

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

    // --- PADRÃO 2: Macros do SugarCube ---
    const macroLinkRegex = /<<link\s+"([^"]+)"\s*>>([\s\S]*?)<<\/link>>/g;
    let macroMatch;

    while ((macroMatch = macroLinkRegex.exec(text))) {
      let choiceText = macroMatch[1].trim();
      const innerContent = macroMatch[2];

      const translationMatch = choiceText.match(/^t\(['"]([^'"]+)['"]\)$/);
      if (translationMatch) {
        choiceText = translationMatch[1];
      }

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

    flushSync(() => {
      setNodes(nds =>
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

  // --- Handlers do Grafo (ReactFlow) ---
  const onConnect = useCallback((params) => {
    takeSnapshot();
    setPendingConnection(params);
  }, [takeSnapshot]);

  const onEdgeUpdate = useCallback((oldEdge, newConnection) => {
    takeSnapshot();
    setEdges((els) => updateEdge(oldEdge, newConnection, els));

    setTimeout(() => {
      const sourceNode = nodes.find(n => n.id === oldEdge.source);
      if (sourceNode) syncChoicesFromText(sourceNode.id, sourceNode.data.content || "");

      const newSourceNode = nodes.find(n => n.id === newConnection.source);
      if (newSourceNode && newConnection.source !== oldEdge.source) {
        syncChoicesFromText(newSourceNode.id, newSourceNode.data.content || "");
      }
    }, 10);
  }, [nodes, setEdges, syncChoicesFromText, takeSnapshot]);

  const handleConnectionConfirm = useCallback(({ type, choiceText, params,
    ifVariable, ifOperator, ifValue,
    ifTargetNodeId, elseTargetNodeId }) => {

    setPendingConnection(null);

    const sourceNode = nodes.find(n => n.id === params.source);
    if (!sourceNode) return;

    if (type === 'simple') {
      const targetNode = nodes.find(n => n.id === params.target);
      if (!targetNode) return;
      const text = choiceText?.trim() || targetNode.data.label;
      const linkSyntax = `[[${text}|${targetNode.data.label}]]`;
      let content = sourceNode.data.content || '';
      if (!content.includes(linkSyntax)) {
        if (content.length > 0 && !content.endsWith('\n')) content += '\n';
        content += linkSyntax;
      }
      setTimeout(() => syncChoicesFromText(sourceNode.id, content), 0);

    } else {
      const ifNode = nodes.find(n => n.id === ifTargetNodeId);
      const elseNode = elseTargetNodeId ? nodes.find(n => n.id === elseTargetNodeId) : null;

      const ifText = choiceText?.trim() || ifNode?.data.label || 'Continuar';
      const elseText = elseNode?.data.label || 'Continuar';

      let block = `<<if $${ifVariable} ${ifOperator} ${ifValue}>>\n`;
      block += `[[${ifText}|${ifNode?.data.label}]]\n`;
      if (elseNode) {
        block += `<<else>>\n`;
        block += `[[${elseText}|${elseNode?.data.label}]]\n`;
      }
      block += `<</if>>`;

      let content = sourceNode.data.content || '';
      if (content.length > 0 && !content.endsWith('\n')) content += '\n';
      content += block;

      setTimeout(() => syncChoicesFromText(sourceNode.id, content), 0);
    }
  }, [nodes, syncChoicesFromText]);

  const onNodeClick = useCallback((event, node) => setSelectedNodeId(node.id), []);
  const onEdgeClick = useCallback((event, edge) => { setSelectedEdgeId(edge.id); setSelectedNodeId(null); }, []);

  // --- Operações de Gestão de Nós ---
  const deleteNode = useCallback((nodeIdToRemove) => {
    if (!nodeIdToRemove) return;
    takeSnapshot();
    setNodes((nds) => nds.filter((n) => n.id !== nodeIdToRemove));
    setEdges((eds) => eds.filter((e) => e.source !== nodeIdToRemove && e.target !== nodeIdToRemove));
    if (selectedNodeId === nodeIdToRemove) setSelectedNodeId(null);
  }, [selectedNodeId, setNodes, setEdges, takeSnapshot]);

  const addNode = useCallback((type, presetLabel = null, presetTags = '') => {
    if (presetLabel) {
      const existingNode = nodes.find(n => n.data.label.toLowerCase() === presetLabel.toLowerCase());
      if (existingNode) {
        alert(t('alerts.specialNodeExists', `O nó especial "${presetLabel}" já existe no projeto.`));
        setSelectedNodeId(existingNode.id);
        return;
      }
    }

    takeSnapshot();
    const numericIds = nodes.map(n => parseInt(n.id, 10)).filter(n => !isNaN(n));
    const nextIdNum = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
    const id = String(nextIdNum);

    let label = presetLabel;

    if (!label) {
      let baseLabel = type === 'javascript'
        ? 'Script'
        : type === 'css'
          ? t('topBar.nodeLabels.style')
          : t('topBar.nodeLabels.scene');

      label = baseLabel;
      let labelNum = 1;
      const existingLabels = new Set(nodes.map(n => n.data.label));

      while (existingLabels.has(label)) {
        labelNum += 1;
        label = `${baseLabel} ${labelNum}`;
      }
    }

    const offset = nodes.length;
    const newNode = {
      id,
      type,
      position: { x: 200 + (offset % 5) * 80, y: 50 + ((offset / 5) | 0) * 80 },
      data: { label, nodeType: type, content: '', choices: [], tags: presetTags }
    };

    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeId(id);
  }, [nodes, setNodes, t, takeSnapshot]);

  const exportToTwine = useCallback((targetFormat = 'keys') => {
    const availableLanguages = translations?.languages || [];
    const normalizedInput = targetFormat.trim().toLowerCase();

    // 1. Caso Mestre: Exportação estruturada em chaves brutas de desenvolvimento
    if (normalizedInput === 'keys' || availableLanguages.length === 0) {
      const result = exportToTwee3(nodes, edges);
      triggerFileDownload(result, 'story_development_keys.twee');
      return;
    }

    // 2. Motor de Compilação Inline em Runtime Monolíngue
    const compiledNodes = nodes.map(node => {
      let nodeContent = node.data?.content || "";
      if (!nodeContent) return node;

      // Resolução A: Substitui as macros de narrativa t('key') ou t("key") pelo termo estático correspondente
      nodeContent = nodeContent.replace(/t\(['"]([^'"]+)['"]\)/g, (match, key) => {
        if (translations.keys[key]?.[normalizedInput]) {
          return translations.keys[key][normalizedInput];
        }
        const fallbackLang = availableLanguages[0];
        return translations.keys[key]?.[fallbackLang] || key;
      });

      // Resolução B: Substitui links de arestas Twine que usam t("key") dentro de [[t("key")|Destino]]
      nodeContent = nodeContent.replace(/\[\[t\(['"]([^'"]+)['"]\)\|/g, (match, key) => {
        const translatedText = translations.keys[key]?.[normalizedInput] || translations.keys[key]?.[availableLanguages[0]] || key;
        return `[[${translatedText}|`;
      });
      nodeContent = nodeContent.replace(/\[\[t\(['"]([^'"]+)['"]\)\]\]/g, (match, key) => {
        const translatedText = translations.keys[key]?.[normalizedInput] || translations.keys[key]?.[availableLanguages[0]] || key;
        return `[[${translatedText}]]`;
      });

      // Resolução C: Substitui ligações de macros nativas do SugarCube <<link "t('key')">>
      nodeContent = nodeContent.replace(/<<link\s+['"]t\(['"]([^'"]+)['"]\)['"]\s*>>/g, (match, key) => {
        const translatedText = translations.keys[key]?.[normalizedInput] || translations.keys[key]?.[availableLanguages[0]] || key;
        return `<<link "${translatedText}">>`;
      });

      return {
        ...node,
        data: {
          ...node.data,
          content: nodeContent
        }
      };
    });

    // 3. Serializa o grafo traduzido e despoleta o download limpo
    const result = exportToTwee3(compiledNodes, edges);
    triggerFileDownload(result, `story_compiled_${normalizedInput}.twee`);

  }, [nodes, edges, translations]);

  const setStartNode = useCallback((nodeId) => {
    const targetNode = nodes.find(n => n.id === nodeId);
    if (!targetNode) return;
    takeSnapshot();

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
        let currentTags = Array.isArray(n.data.tags) ? n.data.tags.join(', ') : String(n.data.tags || "");
        let tags = currentTags.replace(/\bstart\b/gi, '').split(',').map(t => t.trim()).filter(t => t).join(', ');

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
  }, [nodes, setNodes, takeSnapshot]);

  const triggerFileDownload = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  };

  const updateSelectedNode = useCallback((patch) => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.map((n) => (n.id === selectedNodeId ? { ...n, data: { ...n.data, ...patch } } : n)));
  }, [selectedNodeId, setNodes]);

  const runValidation = useCallback(() => {
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
  }, [nodes, edges, t]);

  const runSimulationLog = useCallback(() => {
    runDevSimulationLog(nodes, edges);
  }, [nodes, edges]);

  // --- Importação e Exportação de Ficheiros do Projeto ---
  const handleImport = useCallback(() => {
    try {
      const { nodes: newNodes, edges: newEdges, warnings } = parseTwee3(importText);
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

      // CORREGIDO: Espaço em branco removido para evitar erro de parse sintático
      const avisosParaOEcran = warnings || [];
      setParserWarnings(avisosParaOEcran);
      setImportError('');

    } catch (e) {
      console.error("Erro fatal na importação:", e);
      setImportError('Failed to parse story.');
    }
  }, [importText, setNodes, setEdges]);

  const handleLoadBaseTemplate = useCallback(async () => {
    try {
      // 1. Fetch Twee Template
      const tweeResponse = await fetch('/templates/base_template.twee');
      if (!tweeResponse.ok) {
        throw new Error(`Failed to fetch base_template.twee (status: ${tweeResponse.status})`);
      }
      const tweeText = await tweeResponse.text();
      
      // Parse and format Twee nodes
      const { nodes: newNodes, edges: newEdges, warnings } = parseTwee3(tweeText);
      const systemNodes = ['storyinit', 'storytitle', 'storydata', 'storycaption'];
      const formattedNodes = newNodes.map(n => {
        let tags = Array.isArray(n.data.tags) ? n.data.tags.join(', ') : String(n.data.tags || "");
        if (systemNodes.includes(n.data.label.toLowerCase()) && !tags.includes('secreto')) {
          tags = tags ? `${tags}, secreto` : 'secreto';
        }
        return { ...n, data: { ...n.data, tags } };
      });

      // 2. Fetch CSV Translations
      const csvResponse = await fetch('/translations/base_template.csv');
      if (!csvResponse.ok) {
        throw new Error(`Failed to fetch base_template.csv (status: ${csvResponse.status})`);
      }
      const csvText = await csvResponse.text();

      // Parse CSV
      const [headerLine, ...lines] = csvText.split('\n');
      const languages = headerLine.split(',').slice(1).map(l => l.trim().toLowerCase());
      const newKeys = {};
      lines.forEach(line => {
        if (!line.trim()) return;
        const [key, ...values] = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        newKeys[key] = {};
        languages.forEach((lang, i) => {
          newKeys[key][lang] = values[i]?.replace(/^"|"$/g, '').replace(/""/g, '"') || '';
        });
      });

      // Update state
      setNodes(formattedNodes);
      setEdges(newEdges);
      setTranslations({ languages, keys: newKeys });
      setParserWarnings(warnings || []);
      setImportError('');
      
    } catch (err) {
      console.error("Error loading base template files:", err);
      alert(t('alerts.loadTemplateError', `Failed to load base template files: ${err.message}`));
    }
  }, [setNodes, setEdges, setTranslations, setParserWarnings, setImportError, t]);

  // CORREGIDO: Declarada a função de duplo clique na aresta para evitar erro no-undef
  const onEdgeDoubleClick = useCallback((event, edge) => {
    event.preventDefault();
    event.stopPropagation();

    const reactFlowBounds = document.querySelector('.react-flow').getBoundingClientRect();
    const transformElement = document.querySelector('.react-flow__viewport');
    let zoom = 1;
    let panX = 0;
    let panY = 0;

    if (transformElement) {
      const style = window.getComputedStyle(transformElement);
      const matrix = new DOMMatrix(style.transform);
      zoom = matrix.a;
      panX = matrix.e;
      panY = matrix.f;
    }

    const x = (event.clientX - reactFlowBounds.left - panX) / zoom;
    const y = (event.clientY - reactFlowBounds.top - panY) / zoom;

    setEdges((eds) =>
      eds.map((e) => {
        if (e.id === edge.id) {
          const currentWaypoints = e.data?.waypoints || [];
          return {
            ...e,
            type: 'editable',
            data: { ...e.data, waypoints: [...currentWaypoints, { x, y }] }
          };
        }
        return e;
      })
    );
  }, [setEdges]);

  // Efeito utilitário para escutar atualizações de arrasto vindas da EditableEdge
  useEffect(() => {
    const handleUpdateWaypoints = (e) => {
      const { edgeId, waypoints } = e.detail;
      setEdges((eds) =>
        eds.map((edge) => (edge.id === edgeId ? { ...edge, data: { ...edge.data, waypoints } } : edge))
      );
    };

    window.addEventListener('updateEdgeWaypoints', handleUpdateWaypoints);
    return () => window.removeEventListener('updateEdgeWaypoints', handleUpdateWaypoints);
  }, [setEdges]);

  // CORREGIDO: Declarada de forma explícita a função de abertura do PlayMode
  const handleOpenPlayMode = useCallback(() => {
    const hasSyntaxErrors = nodes.some(node => node.data.warnings && node.data.warnings.length > 0);

    // CORREGIDO: Fecho do parêntese do i18next reparado
    if (hasSyntaxErrors) {
      alert(t('alerts.playModeBlocked'));
      return;
    }

    setIsPlayModeOpen(true);
  }, [nodes, t]);

  // --- Gestão de Teclado, Atalhos Globais e Undo/Redo Histórico ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;

      if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
      else if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedEdgeId) {
          takeSnapshot();
          setEdges((eds) => eds.filter((ed) => ed.id !== selectedEdgeId));
          setSelectedEdgeId(null);
        } else if (selectedNodeId) {
          deleteNode(selectedNodeId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEdgeId, selectedNodeId, setEdges, deleteNode, undo, redo, takeSnapshot]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleOpenPlayMode();
      }
      else if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setIsAiModalOpen(prev => !prev);
      }
      else if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        addNode('choice');
      }
      else if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen(prev => !prev);
      }
      else if (e.key === 'Escape') {
        setIsPlayModeOpen(false);
        setIsAiModalOpen(false);
        setIsSettingsOpen(false);
        closeInfoPopout();
      }
      else if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        addNode('javascript');
      }
      else if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        addNode('css');
      }
      else if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        runValidation();
      }
      else if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        window.dispatchEvent(new Event('triggerThemeToggle'));
      }
      else if (e.ctrlKey && !e.shiftKey && e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        addNode('choice', 'StoryData', 'secreto');
      }
      else if (e.ctrlKey && !e.shiftKey && e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        addNode('choice', 'StoryTitle', 'secreto');
      }
      else if (e.ctrlKey && !e.shiftKey && e.altKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        addNode('choice', 'StoryInit', 'secreto');
      }
      else if (e.ctrlKey && !e.shiftKey && e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        addNode('choice', 'StoryCaption', 'secreto');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addNode, closeInfoPopout, handleOpenPlayMode, runValidation]);

  useEffect(() => {
    const handler = () => toggleTheme();
    window.addEventListener('triggerThemeToggle', handler);
    return () => window.removeEventListener('triggerThemeToggle', handler);
  }, [toggleTheme]);

  useEffect(() => {
    const handleMatrixToggle = () => setIsMatrixOpen(prev => !prev);
    window.addEventListener('triggerMatrixToggle', handleMatrixToggle);
    return () => window.removeEventListener('triggerMatrixToggle', handleMatrixToggle);
  }, []);

  useEffect(() => {
    window.addEventListener('triggerUndo', undo);
    window.addEventListener('triggerRedo', redo);
    return () => {
      window.removeEventListener('triggerUndo', undo);
      window.removeEventListener('triggerRedo', redo);
    };
  }, [undo, redo]);

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
          translations={translations}
        />

        <TranslationMatrix
          isOpen={isMatrixOpen}
          onClose={() => setIsMatrixOpen(false)}
          translations={translations}
          setTranslations={setTranslations}
        />

        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          languages={translations.languages}
          onConfirm={exportToTwine}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          toggleSetting={toggleSetting}
          resetProject={resetProject}
        />

        <div className="flex-1 flex flex-col border-r-2 border-gray-300 relative z-0">
          <TopBar
            addNode={addNode}
            openSettings={() => setIsSettingsOpen(true)}
            openPlayMode={() => handleOpenPlayMode()}
            openAiModal={() => setIsAiModalOpen(true)}
            canUndo={past.length > 0}
            canRedo={future.length > 0}
          />
          <div className="flex-1">
            <ReactFlow
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              nodes={visibleNodes}
              edges={visibleEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onEdgeUpdate={onEdgeUpdate}
              onNodeDragStart={takeSnapshot}
              onNodeDoubleClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onEdgeDoubleClick={onEdgeDoubleClick}
              fitView
              selectionOnDrag
            >

              <MiniMap
                className="!border-2 !border-gray-900 dark:!border-gray-200 !shadow-[4px_4px_0px_#000] dark:!shadow-[4px_4px_0px_#fff] !bg-white dark:!bg-gray-800 transition-colors"
                nodeColor={(n) => {
                  const type = n.data?.nodeType || n.type;

                  if (type === 'javascript') {
                    return '#2563eb';
                  }
                  if (type === 'css') {
                    return '#db2777';
                  }

                  return isDark ? '#f8fafc' : '#1e293b';
                }}
                nodeStrokeColor={(n) => {
                  return isDark ? '#ffffff' : '#000000';
                }}
                maskColor={isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(203, 213, 225, 0.5)'}
                nodeStrokeWidth={3}
                nodeBorderRadius={2}
              />

              <Controls
                className="border-2 border-gray-800 dark:border-gray-200 rounded shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] overflow-hidden [&>button]:dark:bg-gray-800 [&>button]:dark:border-gray-700 [&>button]:dark:fill-gray-200 hover:[&>button]:dark:bg-gray-700 [&>button]:transition-colors"
              />

              <Background
                gap={16}
                color={isDark ? "#475569" : "#cbd5e1"}
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
          onOpenVariables={openVariablesEditor}
          onChangeVariables={openChangeVariablesEditor}
          translations={translations}
          visualLogicEnabled={settings.visualLogicEnabled}
          globalVars={globalVars}
        />

        <DataPanel
          exportToTwine={() => setIsExportModalOpen(true)}
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
          translations={translations}
          setTranslations={setTranslations}
        />

        <Popout
          isOpen={infoPopout.isOpen}
          onClose={closeInfoPopout}
          title={infoPopout.title}
          subtitle={infoPopout.subtitle}
        >
          {infoPopout.content}
        </Popout>

        <VariablesModal
          isOpen={isVarModalOpen}
          onClose={() => setIsVarModalOpen(false)}
          selectedNode={selectedNode}
          nodes={nodes}
          setNodes={setNodes}
          takeSnapshot={takeSnapshot}
          initialMode={varModalMode}
        />

        <ConnectionModal
          isOpen={!!pendingConnection}
          onClose={() => setPendingConnection(null)}
          onConfirm={handleConnectionConfirm}
          params={pendingConnection}
          nodes={nodes}
          globalVars={globalVars}
        />

        <TemplatePromptModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          onLoadBaseTemplate={handleLoadBaseTemplate}
        />
      </div>
    </InfoPopoutProvider>
  );
}

export default App;
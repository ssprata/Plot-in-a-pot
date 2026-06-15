// src/App.jsx
import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
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
import ZoneNode from './components/ZoneNode';
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
import PlaythroughTutorial from './components/PlaythroughTutorial';


// Contexto de Tema e Carregamento de Configurações
import { useTheme } from './contexts/ThemeContext';
import { loadConfig } from './utils/configLoader';
import * as sugarcubeLogic from './utils/sugarcubeLogic';

if (typeof window !== 'undefined') {
  window.sugarcubeLogic = sugarcubeLogic;
}

// --- HELPERS PUROS (fora do componente para não recriar a cada render) ---

// Regex compilado uma única vez
const SET_VAR_REGEX = /<<set\s+\$([\w\d]+)\s*(?:to|=)\s*(.*?)>>/g;

const parseVariablesFromText = (text = '') => {
  const vars = {};
  // Reseta o lastIndex para garantir comportamento correto com regex global reutilizado
  SET_VAR_REGEX.lastIndex = 0;
  let match;
  while ((match = SET_VAR_REGEX.exec(text)) !== null) {
    vars[match[1]] = match[2].trim();
  }
  return vars;
};

// Função utilitária pura — não usa estado, não precisa de estar dentro do componente
const triggerFileDownload = (content, filename) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
};

// Leitura do localStorage fora do componente: executada apenas uma vez no módulo
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

const SAVED_DATA = getSavedData();

// Nó de inicialização padrão caso o armazenamento local esteja vazio
const initialNodes = [
  {
    id: '1',
    type: 'choice',
    position: { x: 250, y: 5 },
    data: { label: 'Start', nodeType: 'choice', content: 'A história começa aqui.', choices: [], tags: '' }
  }
];

// Mapeamento de tipos de nós customizados — objeto estável fora do componente
const nodeTypes = {
  choice: StoryNode,
  javascript: StoryNode,
  css: StoryNode,
  zone: ZoneNode
};

const edgeTypes = {
  editable: EditableEdge
};

// Conjuntos estáticos reutilizados
const SYSTEM_NODE_NAMES = new Set(['storyinit', 'storytitle', 'storydata', 'storycaption']);

// Aplica a tag "secreto" a nós de sistema — função pura partilhada por import e AI import
const formatSystemNodes = (nodes) =>
  nodes.map(n => {
    let tags = Array.isArray(n.data.tags) ? n.data.tags.join(', ') : String(n.data.tags || '');
    if (SYSTEM_NODE_NAMES.has(n.data.label.toLowerCase()) && !tags.includes('secreto')) {
      tags = tags ? `${tags}, secreto` : 'secreto';
    }
    return { ...n, data: { ...n.data, tags } };
  });

// Configuração inicial de settings — extraída para evitar recalcular em cada mount
const buildInitialSettings = () => {
  const config = loadConfig();
  const saved = localStorage.getItem('plot-in-a-pot-settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        showAdjacency: parsed.showAdjacency ?? config.showAdjacency,
        showSecrets: parsed.showSecrets ?? config.showSecrets,
        showFlowErrors: parsed.showFlowErrors ?? config.showFlowErrors,
        showSimulationLegacy: parsed.showSimulationLegacy ?? config.showSimulationLegacy,
        visualLogicEnabled: parsed.visualLogicEnabled ?? (config.visualLogicEnabled !== false),
        visualBlocksMode: parsed.visualBlocksMode ?? false
      };
    } catch (e) { /* ignora parse inválido */ }
  }
  return {
    showAdjacency: config.showAdjacency,
    showSecrets: config.showSecrets,
    showFlowErrors: config.showFlowErrors,
    showSimulationLegacy: config.showSimulationLegacy,
    visualLogicEnabled: config.visualLogicEnabled !== false,
    visualBlocksMode: false
  };
};

function App() {
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();

  // --- Estados Principais ---
  const [nodes, setNodes, onNodesChange] = useNodesState(
    Array.isArray(SAVED_DATA?.nodes) ? SAVED_DATA.nodes : initialNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(SAVED_DATA?.edges || []);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [isPlayModeOpen, setIsPlayModeOpen] = useState(false);
  const [playModeCurrentNodeId, setPlayModeCurrentNodeId] = useState(null);
  const [playModeLanguage, setPlayModeLanguage] = useState('pt');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [importText, setImportText] = useState('');

  // --- Estado dos Modais ---
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isVarModalOpen, setIsVarModalOpen] = useState(false);
  const [pendingConnection, setPendingConnection] = useState(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isTutorialPromptOpen, setIsTutorialPromptOpen] = useState(false);
  const [isTutorialMenuOpen, setIsTutorialMenuOpen] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState(null);
  const [activeStep, setActiveStep] = useState(null);

  useEffect(() => {
    const getCookie = (name) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };
    const seenPrompt = getCookie('seen-template-prompt');
    if (seenPrompt === 'false' || seenPrompt === null) {
      setIsTemplateModalOpen(true);
    }
  }, []);

  useEffect(() => {
    const getCookie = (name) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };
    const seenTutorial = getCookie('seen-tutorial-prompt');
    if (seenTutorial === 'false' || seenTutorial === null) {
      setIsTutorialPromptOpen(true);
    }
  }, []);

  const [importError, setImportError] = useState('');
  const [parserWarnings, setParserWarnings] = useState([]);
  const [validationResult, setValidationResult] = useState(null);

  // --- Estados do Histórico (Undo / Redo) ---
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  // Base de dados de localização persistida no LocalStorage
  const [translations, setTranslations] = useState({
    languages: SAVED_DATA?.translations?.languages || ['pt', 'en'],
    keys: SAVED_DATA?.translations?.keys || {}
  });

  // Refs para acesso estável ao estado atual sem causar dependências em callbacks
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  // --- Estados de Interface ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(buildInitialSettings);

  const [infoPopout, setInfoPopout] = useState({
    isOpen: false,
    title: 'Informações',
    subtitle: '',
    content: null
  });

  const showInfoPopout = useCallback(({ title, subtitle, content }) => {
    setInfoPopout({ isOpen: true, title, subtitle, content });
  }, []);

  const closeInfoPopout = useCallback(() => {
    setInfoPopout((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // --- Estado de Erros de Validação ---
  const [validationErrors, setValidationErrors] = useState([]);

  // --- Cálculos Memorizados do Ciclo do Grafo ---
  const adjacencyList = useMemo(() => buildAdjacencyList(nodes ?? [], edges ?? []), [nodes, edges]);
  const selectedNode = useMemo(() => (nodes ?? []).find((n) => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  // --- Lógica de Gestão de Variáveis ---
  const globalVars = useMemo(() => {
    return (nodes ?? []).reduce((acc, node) => {
      const vars = parseVariablesFromText(node.data.content);
      // Só espalha se houver variáveis neste nó
      return Object.keys(vars).length > 0 ? { ...acc, ...vars } : acc;
    }, {});
  }, [nodes]);

  const [varModalMode, setVarModalMode] = useState('create');

  const openVariablesEditor = useCallback(() => {
    if (!selectedNodeId) return;
    setVarModalMode('create');
    setIsVarModalOpen(true);
  }, [selectedNodeId]);

  const openChangeVariablesEditor = useCallback(() => {
    if (!selectedNodeId) return;
    setVarModalMode('change');
    setIsVarModalOpen(true);
  }, [selectedNodeId]);

  // Filtragem visual para ocultar nós marcados com a tag "secreto"
  const visibleNodes = useMemo(() => {
    let filtered = nodes;
    if (!settings.showSecrets) {
      filtered = nodes.filter(n => {
        const tags = Array.isArray(n.data.tags) ? n.data.tags.join(' ') : String(n.data.tags || '');
        return !tags.toLowerCase().includes('secreto');
      });
    }
    return filtered.map(n => {
      if (n.type === 'zone' || n.data?.nodeType === 'zone') {
        return { ...n, style: { ...n.style, pointerEvents: 'none' } };
      }
      return n;
    });
  }, [nodes, settings.showSecrets]);

  const visibleEdges = useMemo(() => {
    if (settings.showSecrets) return edges;
    const ids = new Set(visibleNodes.map(n => n.id));
    return edges.filter(e => ids.has(e.source) && ids.has(e.target));
  }, [edges, visibleNodes, settings.showSecrets]);

  // --- Auto-Save Atómico ---
  useEffect(() => {
    localStorage.setItem('plot-in-a-pot-project', JSON.stringify({
      nodes,
      edges,
      translations,
      version: '1.0'
    }));
  }, [nodes, edges, translations]);

  // Sincroniza chaves de tradução no motor global do i18next
  useEffect(() => {
    translations.languages.forEach(lang => {
      if (!i18n.hasResourceBundle(lang, 'translation')) {
        i18n.addResourceBundle(lang, 'translation', translations.keys);
      }
    });
  }, [translations, i18n]);

  // Propaga realces do tutorial ativo para as propriedades dos nós
  useEffect(() => {
    if (!activeTutorial || !activeStep) {
      setNodes(nds => nds.map(n => {
        if (n.data.highlight || n.data.highlightHandle) {
          return { ...n, data: { ...n.data, highlight: false, highlightHandle: null } };
        }
        return n;
      }));
      return;
    }

    const firstNodeId = activeStep.highlightNodeId;
    const firstHandle = activeStep.highlightHandle;
    const secondNodeId = activeStep.highlightNodeId2;
    const secondHandle = activeStep.highlightHandle2;

    setNodes(nds => nds.map(n => {
      const isFirst = n.id === firstNodeId;
      const isSecond = n.id === secondNodeId;
      const shouldHighlight = isFirst || isSecond;
      const handle = isFirst ? firstHandle : (isSecond ? secondHandle : null);

      const currentHighlight = !!n.data.highlight;
      const currentHandle = n.data.highlightHandle;

      if (shouldHighlight !== currentHighlight || handle !== currentHandle) {
        return {
          ...n,
          data: {
            ...n.data,
            highlight: shouldHighlight,
            highlightHandle: shouldHighlight ? handle : null
          }
        };
      }
      return n;
    }));
  }, [activeTutorial, activeStep, setNodes]);

  // --- Funções do Histórico ---
  const takeSnapshot = useCallback(() => {
    setPast(prev => [...prev.slice(-50), {
      nodes: JSON.parse(JSON.stringify(nodesRef.current)),
      edges: JSON.parse(JSON.stringify(edgesRef.current))
    }]);
    setFuture([]);
  }, []);

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

  // --- Reset do Projeto ---
  const resetProject = useCallback(() => {
    if (window.confirm(t('alerts.resetConfirm', 'Warning: This will delete all current progress. Continue?'))) {
      localStorage.removeItem('plot-in-a-pot-project');
      window.location.reload();
    }
  }, [t]);

  // --- Sync de Escolhas a partir do Texto (usa nodesRef para evitar dependência em `nodes`) ---
  const syncChoicesFromText = useCallback((nodeId, text) => {
    const localWarnings = [];
    const newChoices = [];
    const newEdgesPatch = [];
    let choiceIndex = 0;

    // Usa ref para leitura sem tornar `nodes` uma dependência do callback
    const currentNodes = nodesRef.current;

    // --- PADRÃO 1: Links normais do Twine ---
    const linkRegex = /\[\[(.*?)(?:\||->)(.*?)\]\]|\[\[(.*?)\]\]/g;
    let match;

    while ((match = linkRegex.exec(text))) {
      const rawText = (match[1] !== undefined ? match[1] : match[3]) || '';
      const targetLabel = (match[2] !== undefined ? match[2] : (match[3] || '')).trim();
      let choiceText = rawText.trim();

      const translationMatch = choiceText.match(/^t\(['"]([^'"]+)['"]\)$/);
      if (translationMatch) choiceText = translationMatch[1];

      if (
        targetLabel.startsWith('$') ||
        targetLabel.startsWith('_') ||
        targetLabel.match(/[\(\)\+\-\*\/\=]/)
      ) {
        localWarnings.push(`A ligação para "${targetLabel}" foi bloqueada. Não uses variáveis no destino.`);
        continue;
      }

      const targetNode = currentNodes.find(n => n.data.label === targetLabel);
      const safeTarget = targetLabel.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '');
      const choiceId = `c-${nodeId}-${safeTarget}-${choiceIndex++}`;

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

    // --- PADRÃO 2: Macros do SugarCube ---
    const macroLinkRegex = /<<link\s+"([^"]+)"\s*>>([\s\S]*?)<<\/link>>/g;
    let macroMatch;

    while ((macroMatch = macroLinkRegex.exec(text))) {
      let choiceText = macroMatch[1].trim();
      const innerContent = macroMatch[2];

      const translationMatch = choiceText.match(/^t\(['"]([^'"]+)['"]\)$/);
      if (translationMatch) choiceText = translationMatch[1];

      const gotoRegex = /<<goto\s+(?:"([^"]+)"|'([^']+)'|([^>\s]+))\s*>>/;
      const gotoMatch = gotoRegex.exec(innerContent);
      const gotoTarget = gotoMatch ? (gotoMatch[1] || gotoMatch[2] || gotoMatch[3]) : null;

      const variavelDestinoRegex =
        /<<set\s+\$(?:passagem_retorno|proximo_destino)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^>\s]+))\s*>>/;
      const variavelMatch = variavelDestinoRegex.exec(innerContent);
      const varTarget = variavelMatch ? (variavelMatch[1] || variavelMatch[2] || variavelMatch[3]) : null;

      let targetTitleRaw = (varTarget || gotoTarget)?.trim();
      if (!targetTitleRaw) continue;

      if (targetTitleRaw.startsWith('$') || targetTitleRaw.startsWith('_')) {
        localWarnings.push(`O macro <<goto>> para "${targetTitleRaw}" foi bloqueado. Não uses variáveis no destino.`);
        continue;
      }

      const targetNode = currentNodes.find(n => n.data.label === targetTitleRaw);
      const safeTarget = targetTitleRaw.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '');
      const choiceId = `c-${nodeId}-${safeTarget}-${choiceIndex++}`;

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

    flushSync(() => {
      setNodes(nds =>
        nds.map(n =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, content: text, choices: newChoices, warnings: localWarnings } }
            : n
        )
      );
    });

    setEdges(eds => [...eds.filter(e => e.source !== nodeId), ...newEdgesPatch]);
  }, [setNodes, setEdges]); // `nodes` removido das dependências — leitura via nodesRef

  // --- Handlers do Grafo (ReactFlow) ---
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

  const onEdgeUpdate = useCallback((oldEdge, newConnection) => {
    if (activeTutorial) return;
    takeSnapshot();

    const currentNodes = nodesRef.current;
    const sourceNode = currentNodes.find(n => n.id === oldEdge.source);
    
    // Helper definition to replace target of choiceIndex-th link
    const updateLinkInText = (textVal, choiceIndex, newTargetLabel) => {
      let index = 0;
      const linkRegex = /(\[\[(.*?)(?:\||->)(.*?)\]\])|(\[\[(.*?)\]\])|(<<link\s+"([^"]+)"\s*>>([\s\S]*?)<<\/link>>)/g;
      
      return textVal.replace(linkRegex, (match, p1, p2, p3, p4, p5, p6, p7, p8) => {
        if (index === choiceIndex) {
          index++;
          if (p1) {
            const separator = match.includes('->') ? '->' : '|';
            return `[[${p2}${separator}${newTargetLabel}]]`;
          } else if (p4) {
            return `[[${newTargetLabel}]]`;
          } else if (p6) {
            let inner = p8;
            const gotoRegex = /(<<goto\s+)(?:"[^"]+"|'[^']+'|[^>\s]+)(\s*>>)/;
            if (gotoRegex.test(inner)) {
              inner = inner.replace(gotoRegex, `$1"${newTargetLabel}"$2`);
            } else {
              const setVarRegex = /(<<set\s+\$(?:passagem_retorno|proximo_destino)\s*=\s*)(?:"[^"]+"|'[^']+'|[^>\s]+)(\s*>>)/;
              if (setVarRegex.test(inner)) {
                inner = inner.replace(setVarRegex, `$1"${newTargetLabel}"$2`);
              }
            }
            return `<<link "${p7}">>${inner}<</link>>`;
          }
        }
        index++;
        return match;
      });
    };

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

    // Fallback: standard update
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

  const handleConnectionConfirm = useCallback(({
    type, choiceText, params,
    ifVariable, ifOperator, ifValue,
    ifTargetNodeId, elseTargetNodeId
  }) => {
    setPendingConnection(null);

    const currentNodes = nodesRef.current;
    const sourceNode = currentNodes.find(n => n.id === params.source);
    if (!sourceNode) return;

    // Helper definition to replace target of choiceIndex-th link
    const updateLinkInText = (textVal, choiceIndex, newTargetLabel, newDisplayText = null) => {
      let index = 0;
      const linkRegex = /(\[\[(.*?)(?:\||->)(.*?)\]\])|(\[\[(.*?)\]\])|(<<link\s+"([^"]+)"\s*>>([\s\S]*?)<<\/link>>)/g;
      
      return textVal.replace(linkRegex, (match, p1, p2, p3, p4, p5, p6, p7, p8) => {
        if (index === choiceIndex) {
          index++;
          if (p1) {
            const separator = match.includes('->') ? '->' : '|';
            const text = newDisplayText !== null && newDisplayText !== '' ? newDisplayText : p2;
            return `[[${text}${separator}${newTargetLabel}]]`;
          } else if (p4) {
            if (newDisplayText !== null && newDisplayText !== '' && newDisplayText !== newTargetLabel) {
              return `[[${newDisplayText}|${newTargetLabel}]]`;
            }
            return `[[${newTargetLabel}]]`;
          } else if (p6) {
            const text = newDisplayText !== null && newDisplayText !== '' ? newDisplayText : p7;
            let inner = p8;
            const gotoRegex = /(<<goto\s+)(?:"[^"]+"|'[^']+'|[^>\s]+)(\s*>>)/;
            if (gotoRegex.test(inner)) {
              inner = inner.replace(gotoRegex, `$1"${newTargetLabel}"$2`);
            } else {
              const setVarRegex = /(<<set\s+\$(?:passagem_retorno|proximo_destino)\s*=\s*)(?:"[^"]+"|'[^']+'|[^>\s]+)(\s*>>)/;
              if (setVarRegex.test(inner)) {
                inner = inner.replace(setVarRegex, `$1"${newTargetLabel}"$2`);
              }
            }
            return `<<link "${text}">>${inner}<</link>>`;
          }
        }
        index++;
        return match;
      });
    };

    // Check if we are updating an existing choice
    const choiceIndex = params.sourceHandle && params.sourceHandle.startsWith('c-')
      ? (sourceNode.data.choices || []).findIndex(c => c.id === params.sourceHandle)
      : -1;

    if (type === 'simple') {
      const targetNode = currentNodes.find(n => n.id === params.target);
      if (!targetNode) return;
      const text = choiceText?.trim() || targetNode.data.label;

      let content = sourceNode.data.content || '';
      if (choiceIndex !== -1) {
        // Update existing choice
        content = updateLinkInText(content, choiceIndex, targetNode.data.label, choiceText?.trim());
      } else {
        // Append new choice
        const linkSyntax = `[[${text}|${targetNode.data.label}]]`;
        if (!content.includes(linkSyntax)) {
          if (content.length > 0 && !content.endsWith('\n')) content += '\n';
          content += linkSyntax;
        }
      }
      setTimeout(() => syncChoicesFromText(sourceNode.id, content), 0);
    } else {
      const ifNode = currentNodes.find(n => n.id === ifTargetNodeId);
      const elseNode = elseTargetNodeId ? currentNodes.find(n => n.id === elseTargetNodeId) : null;
      const ifText = choiceText?.trim() || ifNode?.data.label || 'Continuar';
      const elseText = elseNode?.data.label || 'Continuar';

      let content = sourceNode.data.content || '';
      
      let block = `<<if $${ifVariable} ${ifOperator} ${ifValue}>>\n`;
      block += `[[${ifText}|${ifNode?.data.label}]]\n`;
      if (elseNode) {
        block += `<<else>>\n[[${elseText}|${elseNode?.data.label}]]\n`;
      }
      block += `<</if>>`;

      if (choiceIndex !== -1) {
        content = updateLinkInText(content, choiceIndex, ifNode?.data.label, choiceText?.trim());
      } else {
        if (content.length > 0 && !content.endsWith('\n')) content += '\n';
        content += block;
      }

      setTimeout(() => syncChoicesFromText(sourceNode.id, content), 0);
    }
  }, [syncChoicesFromText]);

  const onNodeClick = useCallback((event, node) => setSelectedNodeId(node.id), []);
  const onEdgeClick = useCallback((event, edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
  }, []);

  // --- Operações de Gestão de Nós ---
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

  const exportToTwine = useCallback((targetFormat = 'keys') => {
    const availableLanguages = translations?.languages || [];
    const normalizedInput = targetFormat.trim().toLowerCase();

    if (normalizedInput === 'keys' || availableLanguages.length === 0) {
      const result = exportToTwee3(nodesRef.current, edgesRef.current);
      triggerFileDownload(result, 'story_development_keys.twee');
      return;
    }

    const compiledNodes = nodesRef.current.map(node => {
      let nodeContent = node.data?.content || '';
      if (!nodeContent) return node;

      // Resolve t('key') / t("key") inline
      nodeContent = nodeContent.replace(/t\(['"]([^'"]+)['"]\)/g, (_, key) =>
        translations.keys[key]?.[normalizedInput] ||
        translations.keys[key]?.[availableLanguages[0]] ||
        key
      );

      // Resolve [[t("key")|Destino]]
      nodeContent = nodeContent.replace(/\[\[t\(['"]([^'"]+)['"]\)\|/g, (_, key) => {
        const text = translations.keys[key]?.[normalizedInput] || translations.keys[key]?.[availableLanguages[0]] || key;
        return `[[${text}|`;
      });
      nodeContent = nodeContent.replace(/\[\[t\(['"]([^'"]+)['"]\)\]\]/g, (_, key) => {
        const text = translations.keys[key]?.[normalizedInput] || translations.keys[key]?.[availableLanguages[0]] || key;
        return `[[${text}]]`;
      });

      // Resolve <<link "t('key')">>
      nodeContent = nodeContent.replace(/<<link\s+['"]t\(['"]([^'"]+)['"]\)['"]\s*>>/g, (_, key) => {
        const text = translations.keys[key]?.[normalizedInput] || translations.keys[key]?.[availableLanguages[0]] || key;
        return `<<link "${text}">>`;
      });

      return { ...node, data: { ...node.data, content: nodeContent } };
    });

    triggerFileDownload(exportToTwee3(compiledNodes, edgesRef.current), `story_compiled_${normalizedInput}.twee`);
  }, [translations]);

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

  const updateSelectedNode = useCallback((patch) => {
    if (!selectedNodeId) return;
    setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, ...patch } } : n));
  }, [selectedNodeId, setNodes]);

  const runValidation = useCallback(() => {
    const result = validateStoryFlow(nodesRef.current, edgesRef.current);
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
  }, [t]);

  const runSimulationLog = useCallback(() => {
    runDevSimulationLog(nodesRef.current, edgesRef.current);
  }, []);

  // --- Importação e Exportação de Ficheiros do Projeto ---
  const handleImport = useCallback(() => {
    try {
      const { nodes: newNodes, edges: newEdges, warnings } = parseTwee3(importText);
      setNodes(formatSystemNodes(newNodes));
      setEdges(newEdges);
      setParserWarnings(warnings || []);
      setImportError('');
    } catch (e) {
      console.error('Erro fatal na importação:', e);
      setImportError('Failed to parse story.');
    }
  }, [importText, setNodes, setEdges]);

  const handleAiImportSuccess = useCallback((tweeText) => {
    try {
      takeSnapshot();
      const { nodes: newNodes, edges: newEdges } = parseTwee3(tweeText);
      setNodes(formatSystemNodes(newNodes));
      setEdges(newEdges);
      alert(t('alerts.aiSuccess', 'AI generated your story successfully!'));
    } catch (e) {
      alert(t('alerts.aiInvalid', 'AI returned invalid output. Please try again.'));
      console.error(e);
    }
  }, [setNodes, setEdges, t, takeSnapshot]);

  const handleLoadBaseTemplate = useCallback(async () => {
    try {
      const [tweeResponse, csvResponse] = await Promise.all([
        fetch('/templates/base_template.twee'),
        fetch('/translations/base_template.csv')
      ]);

      if (!tweeResponse.ok) throw new Error(`Failed to fetch base_template.twee (status: ${tweeResponse.status})`);
      if (!csvResponse.ok) throw new Error(`Failed to fetch base_template.csv (status: ${csvResponse.status})`);

      const [tweeText, csvText] = await Promise.all([tweeResponse.text(), csvResponse.text()]);

      const { nodes: newNodes, edges: newEdges, warnings } = parseTwee3(tweeText);

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

      setNodes(formatSystemNodes(newNodes));
      setEdges(newEdges);
      setTranslations({ languages, keys: newKeys });
      setParserWarnings(warnings || []);
      setImportError('');
    } catch (err) {
      console.error('Error loading base template files:', err);
      alert(t('alerts.loadTemplateError', `Failed to load base template files: ${err.message}`));
    }
  }, [setNodes, setEdges, t]);

  const toggleSetting = useCallback((key) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('plot-in-a-pot-settings', JSON.stringify(updated));
      return updated;
    });
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

  // --- Atalhos Globais de Teclado (fusão dos dois useEffect anteriores) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement.tagName;
      const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';

      if (activeTutorial) {
        if ((e.key === 'Delete' || e.key === 'Backspace') && !isTyping) {
          e.preventDefault();
          return;
        }
        if (e.ctrlKey) {
          const key = e.key.toLowerCase();
          if (isTyping) return;
          if (key === 'p' && activeStep?.allowPlay) {
            e.preventDefault();
            handleOpenPlayMode();
          } else if (key === 'x' && activeStep?.allowAddNode === 'choice') {
            e.preventDefault();
            addNode('choice');
          } else if (key === 'v' && activeStep?.allowValidation) {
            e.preventDefault();
            runValidation();
          } else {
            e.preventDefault();
          }
          return;
        }
        if (e.key === 'Escape') {
          setIsPlayModeOpen(false);
          setIsAiModalOpen(false);
          setIsSettingsOpen(false);
          closeInfoPopout();
        }
        return;
      }

      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        const key = e.key.toLowerCase();

        // Atalhos que funcionam mesmo a escrever (nenhum actualmente — placeholder para consistência)
        if (key === 'z' && !isTyping) { e.preventDefault(); undo(); return; }
        if (key === 'y' && !isTyping) { e.preventDefault(); redo(); return; }

        if (isTyping) return;

        if (key === 'p') { e.preventDefault(); handleOpenPlayMode(); return; }
        if (key === 'i') { e.preventDefault(); setIsAiModalOpen(prev => !prev); return; }
        if (key === 'x') { e.preventDefault(); addNode('choice'); return; }
        if (key === ',') { e.preventDefault(); setIsSettingsOpen(prev => !prev); return; }
        if (key === 's') { e.preventDefault(); addNode('javascript'); return; }
        if (key === 'e') { e.preventDefault(); addNode('css'); return; }
        if (key === 'v') { e.preventDefault(); runValidation(); return; }
        if (key === 'm') { e.preventDefault(); window.dispatchEvent(new Event('triggerThemeToggle')); return; }
      }

      if (e.ctrlKey && !e.shiftKey && e.altKey && !isTyping) {
        const key = e.key.toLowerCase();
        if (key === 'z') { e.preventDefault(); addNode('zone'); return; }
        if (key === 'd') { e.preventDefault(); addNode('choice', 'StoryData', 'secreto'); return; }
        if (key === 't') { e.preventDefault(); addNode('choice', 'StoryTitle', 'secreto'); return; }
        if (key === 'i') { e.preventDefault(); addNode('choice', 'StoryInit', 'secreto'); return; }
        if (key === 'c') { e.preventDefault(); addNode('choice', 'StoryCaption', 'secreto'); return; }
      }

      if (!isTyping) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (selectedEdgeId) {
            takeSnapshot();
            setEdges(eds => eds.filter(ed => ed.id !== selectedEdgeId));
            setSelectedEdgeId(null);
          } else if (selectedNodeId) {
            deleteNode(selectedNodeId);
          }
          return;
        }
        if (e.key === 'Escape') {
          setIsPlayModeOpen(false);
          setIsAiModalOpen(false);
          setIsSettingsOpen(false);
          closeInfoPopout();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEdgeId, selectedNodeId, setEdges, deleteNode, undo, redo, takeSnapshot, addNode, closeInfoPopout, handleOpenPlayMode, runValidation, activeTutorial, activeStep]);

  // --- Listeners de Eventos Globais (fusão dos vários useEffect anteriores) ---
  useEffect(() => {
    const onThemeToggle = () => toggleTheme();
    const onMatrixToggle = () => setIsMatrixOpen(prev => !prev);
    const onUndo = () => undo();
    const onRedo = () => redo();
    const onUpdateWaypoints = (e) => {
      const { edgeId, waypoints } = e.detail;
      setEdges(eds => eds.map(edge => edge.id === edgeId ? { ...edge, data: { ...edge.data, waypoints } } : edge));
    };

    window.addEventListener('triggerThemeToggle', onThemeToggle);
    window.addEventListener('triggerMatrixToggle', onMatrixToggle);
    window.addEventListener('triggerUndo', onUndo);
    window.addEventListener('triggerRedo', onRedo);
    window.addEventListener('updateEdgeWaypoints', onUpdateWaypoints);

    return () => {
      window.removeEventListener('triggerThemeToggle', onThemeToggle);
      window.removeEventListener('triggerMatrixToggle', onMatrixToggle);
      window.removeEventListener('triggerUndo', onUndo);
      window.removeEventListener('triggerRedo', onRedo);
      window.removeEventListener('updateEdgeWaypoints', onUpdateWaypoints);
    };
  }, [toggleTheme, undo, redo, setEdges]);

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
          onCurrentNodeIdChange={setPlayModeCurrentNodeId}
          onGameLanguageChange={setPlayModeLanguage}
          activeStep={activeStep}
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
          openTutorialMenu={() => {
            setIsSettingsOpen(false);
            setIsTutorialMenuOpen(true);
          }}
        />

        <div className="flex-1 flex flex-col border-r-2 border-gray-300 relative z-0">
          <TopBar
            addNode={addNode}
            openSettings={() => setIsSettingsOpen(true)}
            openPlayMode={() => handleOpenPlayMode()}
            openAiModal={() => setIsAiModalOpen(true)}
            openTutorialMenu={() => setIsTutorialMenuOpen(true)}
            canUndo={past.length > 0}
            canRedo={future.length > 0}
            activeStep={activeStep}
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
              onNodeDragStop={onNodeDragStop}
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
                  if (type === 'javascript') return '#2563eb';
                  if (type === 'css') return '#db2777';
                  return isDark ? '#f8fafc' : '#1e293b';
                }}
                nodeStrokeColor={() => isDark ? '#ffffff' : '#000000'}
                maskColor={isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(203, 213, 225, 0.5)'}
                nodeStrokeWidth={3}
                nodeBorderRadius={2}
              />
              <Controls className="border-2 border-gray-800 dark:border-gray-200 rounded shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] overflow-hidden [&>button]:dark:bg-gray-800 [&>button]:dark:border-gray-700 [&>button]:dark:fill-gray-200 hover:[&>button]:dark:bg-gray-700 [&>button]:transition-colors" />
              <Background gap={16} color={isDark ? '#475569' : '#cbd5e1'} />
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
          visualBlocksMode={settings.visualBlocksMode}
          globalVars={globalVars}
          activeStep={activeStep}
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
          activeStep={activeStep}
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
          activeStep={activeStep}
        />

        <ConnectionModal
          isOpen={!!pendingConnection}
          onClose={() => setPendingConnection(null)}
          onConfirm={handleConnectionConfirm}
          params={pendingConnection}
          nodes={nodes}
          globalVars={globalVars}
          activeStep={activeStep}
        />

        <TemplatePromptModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          onLoadBaseTemplate={handleLoadBaseTemplate}
        />

        <PlaythroughTutorial
          nodes={nodes}
          setNodes={setNodes}
          edges={edges}
          setEdges={setEdges}
          translations={translations}
          setTranslations={setTranslations}
          selectedNodeId={selectedNodeId}
          setSelectedNodeId={setSelectedNodeId}
          validationResult={validationResult}
          runValidation={runValidation}
          isPlayModeOpen={isPlayModeOpen}
          setIsPlayModeOpen={setIsPlayModeOpen}
          isTutorialPromptOpen={isTutorialPromptOpen}
          setIsTutorialPromptOpen={setIsTutorialPromptOpen}
          isTutorialMenuOpen={isTutorialMenuOpen}
          setIsTutorialMenuOpen={setIsTutorialMenuOpen}
          activeTutorial={activeTutorial}
          setActiveTutorial={setActiveTutorial}
          isVarModalOpen={isVarModalOpen}
          playModeCurrentNodeId={playModeCurrentNodeId}
          playModeLanguage={playModeLanguage}
          onActiveStepChange={setActiveStep}
        />
      </div>
    </InfoPopoutProvider>
  );
}

export default App;
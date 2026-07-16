// src/App.jsx
// Aplicação principal do editor de histórias visuais.
// Orquestra os hooks customizados, calcula dados derivados e compõe o JSX.
import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';

// Utilitários de Lógica e Parsing
import { buildAdjacencyList } from './utils/graphMath';
import { validateStoryFlow } from './utils/storyValidator';
import { runDevSimulationLog } from './utils/storySimulator';
import { parseVariablesFromText } from './utils/textParsing';

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
import ValidationModal from './components/ValidationModal';
import { InfoPopoutProvider } from './contexts/InfoPopoutContext';
import { useTranslation } from 'react-i18next';
import TemplatePromptModal from './components/TemplatePromptModal';
import PlaythroughTutorial from './components/PlaythroughTutorial';

// Contexto de Tema e Carregamento de Configurações
import { useTheme } from './contexts/ThemeContext';
import * as sugarcubeLogic from './utils/sugarcubeLogic';

// Custom Hooks
import { useSettings } from './hooks/useSettings';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useChoiceSync } from './hooks/useChoiceSync';
import { useNodeOperations } from './hooks/useNodeOperations';
import useGraphHandlers from './hooks/useGraphHandlers';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import { useProjectPersistence } from './hooks/useProjectPersistence';

if (typeof window !== 'undefined') {
  window.sugarcubeLogic = sugarcubeLogic;
}

// --- CONSTANTES (fora do componente para não recriar a cada render) ---

// Lê o projeto salvo do LocalStorage na carga inicial do módulo.
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

// Nó inicial padrão usado quando não existe projeto salvo no LocalStorage.
const initialNodes = [
  {
    id: '1',
    type: 'choice',
    position: { x: 250, y: 5 },
    data: { label: 'Start', nodeType: 'choice', content: 'A história começa aqui.', choices: [], tags: '' }
  }
];

// Mapeamento de tipos de nós customizados para o ReactFlow.
const nodeTypes = {
  choice: StoryNode,
  javascript: StoryNode,
  css: StoryNode,
  zone: ZoneNode
};

// Tipos de aresta personalizados
const edgeTypes = {
  editable: EditableEdge,
  default: EditableEdge
};

function App() {
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();

  // --- Estados Principais do Grafo ---
  const [nodes, setNodes, onNodesChange] = useNodesState(
    Array.isArray(SAVED_DATA?.nodes) ? SAVED_DATA.nodes : initialNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(SAVED_DATA?.edges || []);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);

  // --- Estados de Modais ---
  const [isPlayModeOpen, setIsPlayModeOpen] = useState(false);
  const [playModeCurrentNodeId, setPlayModeCurrentNodeId] = useState(null);
  const [playModeLanguage, setPlayModeLanguage] = useState('pt');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isVarModalOpen, setIsVarModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [validationModalResult, setValidationModalResult] = useState(null);
  const [pendingConnection, setPendingConnection] = useState(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isTutorialPromptOpen, setIsTutorialPromptOpen] = useState(false);
  const [isTutorialMenuOpen, setIsTutorialMenuOpen] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState(null);
  const [activeStep, setActiveStep] = useState(null);
  const [importError, setImportError] = useState('');
  const [parserWarnings, setParserWarnings] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Verifica se o prompt de template já foi mostrado e abre-o na primeira carga.
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

  // Verifica se o prompt do tutorial já foi mostrado e exibe-o quando necessário.
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

  // Traduções do projeto, persistidas no LocalStorage.
  const [translations, setTranslations] = useState({
    languages: SAVED_DATA?.translations?.languages || ['pt', 'en'],
    keys: SAVED_DATA?.translations?.keys || {}
  });

  // Refs para acesso estável ao estado atual sem causar dependências em callbacks.
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  // --- Custom Hooks ---
  const { settings, toggleSetting, updateSetting } = useSettings();

  const { takeSnapshot, undo, redo, past, future } = useUndoRedo({
    nodesRef, edgesRef, setNodes, setEdges, setSelectedNodeId, setSelectedEdgeId
  });

  const { syncChoicesFromText, handleConnectionConfirm } = useChoiceSync({
    nodesRef, setNodes, setEdges, setPendingConnection
  });

  const { addNode, deleteNode, duplicateNode, updateSelectedNode, setStartNode } = useNodeOperations({
    nodesRef, setNodes, setEdges, setSelectedNodeId, selectedNodeId,
    takeSnapshot, syncChoicesFromText, t, activeTutorial, activeStep
  });

  const {
    onConnect, onEdgeUpdate, onNodeDragStop, onNodeClick, onEdgeClick,
    handleOpenPlayMode, onEdgeDoubleClick
  } = useGraphHandlers({
    nodesRef, setNodes, setEdges, takeSnapshot, syncChoicesFromText,
    setPendingConnection, setSelectedNodeId, setSelectedEdgeId,
    setIsPlayModeOpen, activeTutorial, activeStep, t
  });

  const { exportToTwine, handleImport, handleAiImportSuccess, handleLoadBaseTemplate } = useProjectPersistence({
    nodes, edges, translations, setTranslations,
    nodesRef, edgesRef, setNodes, setEdges,
    setParserWarnings, setImportError, importText,
    takeSnapshot, t, i18n
  });

  // --- Estados de Interface Restantes ---
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

  // --- Funções Locais ---
  const resetProject = useCallback(() => {
    if (window.confirm(t('alerts.resetConfirm', 'Warning: This will delete all current progress. Continue?'))) {
      localStorage.removeItem('plot-in-a-pot-project');
      window.location.reload();
    }
  }, [t]);

  const runValidation = useCallback(() => {
    const result = validateStoryFlow(nodesRef.current, edgesRef.current);
    setValidationErrors(result.unreachableEdges);
    setValidationResult(result);
    setValidationModalResult(result);
    setIsValidationModalOpen(true);
  }, []);

  const runSimulationLog = useCallback(() => {
    runDevSimulationLog(nodesRef.current, edgesRef.current);
  }, []);

  // --- Atalhos de Teclado (depende de closeInfoPopout e runValidation, por isso vem depois) ---
  useKeyboardShortcuts({
    selectedEdgeId, selectedNodeId, setEdges, deleteNode, undo, redo,
    takeSnapshot, addNode, closeInfoPopout,
    handleOpenPlayMode, runValidation,
    activeTutorial, activeStep,
    setIsPlayModeOpen, setIsAiModalOpen, setIsSettingsOpen, setSelectedEdgeId
  });

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

  // --- Cálculos Memorizados ---
  const adjacencyList = useMemo(() => buildAdjacencyList(nodes ?? [], edges ?? []), [nodes, edges]);
  const selectedNode = useMemo(() => (nodes ?? []).find((n) => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  const globalVars = useMemo(() => {
    return (nodes ?? []).reduce((acc, node) => {
      const vars = parseVariablesFromText(node.data.content);
      return Object.keys(vars).length > 0 ? { ...acc, ...vars } : acc;
    }, {});
  }, [nodes]);

  const unreachableNodeIds = useMemo(() => {
    if (!validationResult || !validationResult.orphanNodes) return new Set();
    return new Set(validationResult.orphanNodes.map(n => n.id));
  }, [validationResult]);

  const reachableNodeIds = useMemo(() => {
    if (!validationResult || !validationResult.reachableNodes) return new Set();
    return validationResult.reachableNodes;
  }, [validationResult]);

  const visibleNodes = useMemo(() => {
    let filtered = nodes;
    if (!settings.showSecrets) {
      filtered = nodes.filter(n => {
        const tags = Array.isArray(n.data.tags) ? n.data.tags.join(' ') : String(n.data.tags || '');
        return !tags.toLowerCase().includes('secreto');
      });
    }
    return filtered.map(n => {
      const isUnreachable = unreachableNodeIds.has(n.id);
      let updatedNode = {
        ...n,
        data: {
          ...n.data,
          isUnreachable
        }
      };
      if (n.type === 'zone' || n.data?.nodeType === 'zone') {
        updatedNode.style = { ...updatedNode.style, pointerEvents: 'none' };
      }
      return updatedNode;
    });
  }, [nodes, settings.showSecrets, unreachableNodeIds]);

  const visibleEdges = useMemo(() => {
    let filteredEdges = edges;
    if (!settings.showSecrets) {
      const ids = new Set(visibleNodes.map(n => n.id));
      filteredEdges = edges.filter(e => ids.has(e.source) && ids.has(e.target));
    }
    return filteredEdges.map(e => {
      const isUnreachable = unreachableNodeIds.has(e.target) && reachableNodeIds.has(e.source);
      return {
        ...e,
        data: {
          ...e.data,
          isUnreachable
        }
      };
    });
  }, [edges, visibleNodes, settings.showSecrets, unreachableNodeIds, reachableNodeIds]);

  // --- Efeitos de UI ---
  // Atualiza os realces dos nós conforme o tutorial avança.
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

  // Sincroniza a propriedade bgImageBlur dos nós sempre que o setting mudar.
  useEffect(() => {
    setNodes(nds => nds.map(n => {
      if (n.data.bgImageBlur !== settings.bgImageBlur) {
        return {
          ...n,
          data: {
            ...n.data,
            bgImageBlur: settings.bgImageBlur
          }
        };
      }
      return n;
    }));
  }, [settings.bgImageBlur, setNodes]);

  // --- Listeners de Eventos Globais ---
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

        <ValidationModal
          isOpen={isValidationModalOpen}
          onClose={() => setIsValidationModalOpen(false)}
          result={validationModalResult}
          showSimulation={settings.showSimulationOnValidation}
          nodes={nodes}
        />

        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            toggleSetting={toggleSetting}
            updateSetting={updateSetting}
            resetProject={resetProject}
            openTutorialMenu={() => {
              setIsSettingsOpen(false);
              setIsTutorialMenuOpen(true);
            }}
          />
        )}

        <div className="flex-1 flex flex-col border-r-4 border-gray-900 dark:border-gray-700 relative z-0">
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
              deleteKeyCode={activeStep ? null : ['Delete']}
              fitView
              selectionOnDrag
            >
              <MiniMap
                className="!border-2 !border-gray-900 dark:!border-gray-200 !shadow-[4px_4px_0px_#000] dark:!shadow-[4px_4px_0px_#fff] !bg-white dark:!bg-gray-800 transition-colors"
                nodeColor={(n) => {
                  const type = n.data?.nodeType || n.type;
                  if (type === 'zone') {
                    const zoneColor = n.data?.color || '#f59e0b';
                    return `${zoneColor}22`;
                  }
                  if (type === 'javascript') return '#2563eb';
                  if (type === 'css') return '#db2777';
                  return isDark ? '#f8fafc' : '#1e293b';
                }}
                nodeStrokeColor={(n) => {
                  const type = n.data?.nodeType || n.type;
                  if (type === 'zone') {
                    return n.data?.color || '#f59e0b';
                  }
                  return isDark ? '#ffffff' : '#000000';
                }}
                maskColor={isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(203, 213, 225, 0.5)'}
                nodeStrokeWidth={3}
                nodeBorderRadius={2}
              />
              <Controls className="border-2 border-gray-800 dark:border-gray-200 rounded shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] overflow-hidden [&>button]:dark:bg-gray-800 [&>button]:dark:border-gray-700 [&>button]:dark:fill-gray-200 hover:[&>button]:dark:bg-gray-700 [&>button]:transition-colors" />
              <Background gap={16} color={isDark ? '#475569' : '#94a3b8'} />
            </ReactFlow>
          </div>
        </div>

        <Inspector
          selectedNode={selectedNode}
          nodes={nodes}
          updateSelectedNode={updateSelectedNode}
          deleteNode={deleteNode}
          duplicateNode={duplicateNode}
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
          openPlayMode={() => handleOpenPlayMode()}
          nodes={nodes}
          settings={settings}
          toggleSetting={toggleSetting}
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
// src/components/PlayMode.jsx
/* eslint-disable no-new-func */
import React, { useState, useEffect } from 'react';
import { findStartNode, getInitialState, applyModifiers, canAccessChoice } from '../utils/sugarcubeLogic';
import Minimap from './Minimap';
import VariablesModal from './VariablesModal';
import { useInfoPopout } from '../contexts/InfoPopoutContext';
import { useTranslation } from 'react-i18next';

const getImageUrl = (bgImage) => {
  if (!bgImage) return '';
  if (bgImage.startsWith('data:') || bgImage.startsWith('http://') || bgImage.startsWith('https://')) {
    return bgImage;
  }
  const publicUrl = process.env.PUBLIC_URL || '';
  return `${publicUrl}/presets/${bgImage}`;
};

export default function PlayMode({ isOpen, onClose, nodes, edges, translations, onCurrentNodeIdChange, onGameLanguageChange, activeStep }) {
  // --- ESTADOS DO JOGO ---
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [currentState, setCurrentState] = useState({});
  const [history, setHistory] = useState([]);
  const [isDevMode, setIsDevMode] = useState(false);
  const [hoveredTargets, setHoveredTargets] = useState([]);
  const [isVarModalOpen, setIsVarModalOpen] = useState(false);
  
  const { showInfoPopout } = useInfoPopout();
  const { t } = useTranslation();
  
  // Estado local que dita a linguagem ativa de simulação da história
  const [gameLanguage, setGameLanguage] = useState('pt');

  // --- FUNÇÃO DE TRADUÇÃO RESILIENTE ---
  // Otimizada para detetar e limpar wrappers textuais do tipo t('...') ou t("...") de forma automática
  const translateStoryKey = (rawKey) => {
    if (!rawKey) return "";
    let cleanKey = rawKey.trim();
    
    // CORREÇÃO: Se a chave vier envolvida na macro do parser (ex: t("choices.key")), isola apenas o interior
    const macroMatch = cleanKey.match(/^t\(['"]([^'"]+)['"]\)$/);
    if (macroMatch) {
      cleanKey = macroMatch[1];
    }

    // Procura o termo traduzido dentro do dicionário dinâmico carregado
    if (translations?.keys?.[cleanKey]?.[gameLanguage]) {
      return translations.keys[cleanKey][gameLanguage];
    }
    
    // Fallback: Se não existir na linguagem selecionada, tenta reverter para a língua mãe do projeto
    const defaultLang = translations?.languages?.[0];
    if (defaultLang && translations?.keys?.[cleanKey]?.[defaultLang]) {
      return translations.keys[cleanKey][defaultLang];
    }
    
    return cleanKey; // Retorna a chave limpa caso não encontre correspondência
  };

  // --- ESCUTAR ATALHO GLOBAL ---
  useEffect(() => {
    const handleDevHotkey = () => setIsDevMode(prev => !prev);
    window.addEventListener('triggerDevModeToggle', handleDevHotkey);
    return () => window.removeEventListener('triggerDevModeToggle', handleDevHotkey);
  }, []);

  // --- INJEÇÃO DE STYLESHEETS (CSS) ---
  useEffect(() => {
    if (isOpen) {
      const styleNodes = nodes.filter(n => n.data?.nodeType === 'css' || n.type === 'css');
      const cssContent = styleNodes.map(n => n.data?.content || '').join('\n');
      
      const existing = document.getElementById('playmode-stylesheet');
      if (existing) existing.remove();
      
      if (cssContent) {
        const styleEl = document.createElement('style');
        styleEl.id = 'playmode-stylesheet';
        styleEl.textContent = cssContent;
        document.head.appendChild(styleEl);
      }
    } else {
      const existing = document.getElementById('playmode-stylesheet');
      if (existing) existing.remove();
    }
    
    return () => {
      const existing = document.getElementById('playmode-stylesheet');
      if (existing) existing.remove();
    };
  }, [isOpen, nodes]);

  // --- ARRANQUE DO JOGO ---
  useEffect(() => {
    if (isOpen) {
      const startNode = findStartNode(nodes);
      if (startNode) {
        let initialState = getInitialState(nodes);
        
        // Executar nós de script (Javascript) para inicializar/modificar o estado
        const scriptNodes = nodes.filter(n => n.data?.nodeType === 'javascript' || n.type === 'javascript');
        scriptNodes.forEach(node => {
          try {
            const scriptContent = node.data?.content || '';
            const State = {
              variables: initialState
            };
            const setup = {};
            const evaluator = new Function('state', 'State', 'setup', scriptContent);
            evaluator(initialState, State, setup);
          } catch (e) {
            console.error(`Erro ao executar nó de script "${node.data?.label}":`, e);
          }
        });

        const startState = applyModifiers(startNode.data.content, initialState);
        
        setCurrentNodeId(startNode.id);
        setCurrentState(startState);
        setHistory([startNode.data.label]);

        if (translations?.languages?.length > 0) {
          setGameLanguage(translations.languages[0]);
        }
      }
    }
  }, [isOpen, nodes, translations]);

  // --- NOTIFICAR ALTERAÇÃO DE ESTADO ---
  useEffect(() => {
    if (isOpen) {
      onCurrentNodeIdChange?.(currentNodeId);
    }
  }, [currentNodeId, isOpen, onCurrentNodeIdChange]);

  useEffect(() => {
    if (isOpen) {
      onGameLanguageChange?.(gameLanguage);
    }
  }, [gameLanguage, isOpen, onGameLanguageChange]);

  if (!isOpen) return null;

  // --- OBTER DADOS DO NÓ ATUAL ---
  const currentNode = nodes.find(n => n.id === currentNodeId);
  if (!currentNode) return null;

  const parentZone = currentNode.parentId ? nodes.find(n => n.id === currentNode.parentId) : null;
  const parentBgImage = currentNode.data?.bgImage ? null : parentZone?.data?.bgImage;
  const parentBgImageBlur = parentZone?.data?.bgImageBlur;
  const hasBgImage = !!(currentNode.data?.bgImage || parentBgImage);

  const currentTags = currentNode.data?.tags 
    ? currentNode.data.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== "") 
    : [];

  // --- PROCESSAMENTO DO TEXTO NARRATIVO ---
  const processNarrativeText = (text, state) => {
    if (!text) return "";
    let processedText = text;

    // Substitui macros de tradução explícitas com aspas simples ou duplas
    processedText = processedText.replace(/t\(['"]([^'"]+)['"]\)/g, (match, key) => {
        return translateStoryKey(key); 
    });

    // Encontra e processa macros de impressão de variáveis ex: <<print $nome>>
    processedText = processedText.replace(/<<(?:print|=)\s+(\$|_)([a-zA-Z_][a-zA-Z0-9_]*)\s*>>/g, (match, prefix, varName) => {
      return state[varName] !== undefined ? String(state[varName]) : '';
    });

    // Limpa blocos técnicos de código invisível e links nativos do Twine
    processedText = processedText
      .replace(/\/%[\s\S]*?%\//g, '') 
      .replace(/<<[\s\S]*?>>/g, '')   
      .replace(/\[\[.*?\]\]/g, '');   

    // CORREÇÃO: Limpeza de linhas órfãs que continham apenas marcadores de lista (* ) ou que ficaram vazias
    processedText = processedText.split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (trimmed === '*' || trimmed === '') return null;
        if (trimmed.startsWith('*')) {
          const contentAfterBullet = trimmed.substring(1).trim();
          if (contentAfterBullet === '') return null;
        }
        return line;
      })
      .filter(line => line !== null)
      .join('\n');

    // Se o resultado final da linha limpa for uma chave pura da base de dados, traduz de imediato
    if (translations?.keys?.[processedText.trim()]) {
      processedText = translateStoryKey(processedText.trim());
    }

    // Deteta e imprime variáveis expostas diretamente no corpo do texto (ex: $ouro)
    processedText = processedText.replace(/(\$|_)([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, prefix, varName) => {
      return state[varName] !== undefined ? String(state[varName]) : match; 
    });

    return processedText.trim();
  };

  const narrativeText = processNarrativeText(currentNode.data.content, currentState);

  // --- CÁLCULO DE ESCOLHAS ---
  const outgoingEdges = edges.filter(e => e.source === currentNodeId);
  const allChoices = outgoingEdges.map(edge => {
    const choice = currentNode.data.choices?.find(c => c.id === edge.sourceHandle);
    if (!choice) return null;
    const isAccessible = canAccessChoice(currentNode.data.content, choice.text, currentState);
    return { edge, choice, isAccessible };
  }).filter(Boolean);

  const visibleChoices = isDevMode ? allChoices : allChoices.filter(c => c.isAccessible);

  // --- NAVEGAÇÃO ---
  const handleChoiceClick = (targetNodeId) => {
    const nextNode = nodes.find(n => n.id === targetNodeId);
    if (!nextNode) return;
    const newState = applyModifiers(nextNode.data.content, currentState);
    setCurrentState(newState);
    setCurrentNodeId(targetNodeId);
    setHistory(prev => [...prev, nextNode.data.label]);
  };

  const infoPopoutContent = (
    <div className="space-y-4 text-sm leading-relaxed text-gray-200">
      <p>{t('playMode.devHelpLine1')}</p>
      <p>{t('playMode.devHelpLine2')}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex bg-gray-950 text-gray-100 font-sans overflow-hidden">
      {/* Parent Zone Blurred background image element */}
      {parentBgImage && (
        <div
          className="absolute inset-0 z-0 pointer-events-none bg-cover bg-center transition-all duration-500"
          style={{
            backgroundImage: `url(${getImageUrl(parentBgImage)})`,
            filter: `blur(${parentBgImageBlur ?? 5}px)`,
            transform: 'scale(1.15)',
            opacity: 0.25
          }}
        />
      )}

      {/* Blurred background image element (rendered above zone background) */}
      {currentNode.data?.bgImage && (
        <div
          className="absolute inset-0 z-[1] pointer-events-none bg-cover bg-center transition-all duration-500"
          style={{
            backgroundImage: `url(${getImageUrl(currentNode.data.bgImage)})`,
            filter: `blur(${currentNode.data.bgImageBlur ?? 5}px)`,
            transform: 'scale(1.15)',
            opacity: 0.25
          }}
        />
      )}

      {/* ÁREA DO JOGO PRINCIPAL */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto relative z-10 bg-transparent">
        {isDevMode && (
          <div style={{position: 'absolute', right: -80, bottom: 16, transform: 'translateX(-50%)', zIndex: 10}}>
            <Minimap
              nodes={nodes}
              edges={edges}
              currentNodeId={currentNodeId}
              hoveredOptionTargets={hoveredTargets}
            />
          </div>
        )}

        <div className={`max-w-2xl w-full border-2 rounded-lg p-8 shadow-2xl transition-all duration-300 relative z-10 ${
          hasBgImage
            ? 'bg-gray-900/80 border-gray-700/80 backdrop-blur-[2px]'
            : 'bg-gray-900 border-gray-700'
        }`}>
          <h2 className="text-2xl font-bold border-b-2 border-gray-700 pb-4 mb-6 uppercase tracking-wider text-yellow-400">
            {currentNode.data.label}
          </h2>
          
          <p className="text-lg leading-relaxed whitespace-pre-wrap mb-8 text-gray-200">
            {narrativeText || t('playMode.noNarrative')}
          </p>

          <div className="flex flex-col gap-3">
            {visibleChoices.length === 0 ? (
               <div className="text-center italic text-gray-500 border-t-2 border-gray-800 pt-6">
                 {t('playMode.endOfStory')}
               </div>
            ) : (
              visibleChoices.map(({ edge, choice, isAccessible }) => {
                const isTargetChoice = activeStep?.choiceTarget === edge.target;
                return (
                  <button
                    key={choice.id}
                    disabled={!isAccessible}
                    onClick={() => handleChoiceClick(edge.target)}
                    onMouseEnter={() => setHoveredTargets([edge.target])}
                    onMouseLeave={() => setHoveredTargets([])}
                    className={`px-4 py-3 text-left font-bold rounded border-2 transition-colors ${
                      isAccessible 
                        ? 'border-blue-500 bg-blue-900/30 hover:bg-blue-600 hover:text-white cursor-pointer' 
                        : 'border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed opacity-60'
                    } ${isTargetChoice ? 'tutorial-btn-flash' : ''}`}
                  >
                    {!isAccessible && <span className="mr-2 font-black tracking-widest">[{t('playMode.blocked')}]</span>}
                    {/* CORREGIDO: A função agora limpa wrappers automaticamente antes de renderizar a tradução */}
                    {translateStoryKey(choice.text)}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* PAINEL LATERAL DE DEPURAÇÃO */}
      <div className={`w-80 border-l-4 p-6 flex flex-col overflow-y-auto relative z-10 transition-all duration-300 ${
        hasBgImage
          ? 'bg-gray-900/80 border-gray-700/80 backdrop-blur-[2px]'
          : 'bg-gray-900 border-gray-700'
      }`}>
        <div className="mb-8 space-y-3">
          
          {translations?.languages?.length > 0 && (
            <div className="flex flex-col gap-1 border-2 border-gray-700 bg-gray-950 p-2 rounded">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                Story Language:
              </span>
              <select
                value={gameLanguage}
                onChange={(e) => setGameLanguage(e.target.value)}
                className={`w-full bg-gray-800 text-white p-1 text-xs font-mono font-bold uppercase border border-gray-600 outline-none cursor-pointer focus:border-yellow-400 ${
                  activeStep?.highlightButton === 'languageSelect' ? 'tutorial-btn-flash' : ''
                }`}
              >
                {translations.languages.map(lang => (
                  <option key={lang} value={lang}>
                    {lang.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={onClose}
            className={`w-full border-2 border-gray-500 hover:border-white text-gray-300 hover:text-white font-bold py-2 uppercase tracking-widest transition-colors ${
              activeStep?.highlightButton === 'endTest' ? 'tutorial-btn-flash' : ''
            }`}
          >
            {t('playMode.endTest')}
          </button>

          <button
            onClick={() => showInfoPopout({ title: t('playMode.help'), content: infoPopoutContent })}
            className="w-full flex items-center justify-center gap-2 border-2 border-blue-500 bg-blue-600 text-white font-bold py-2 uppercase tracking-widest transition-colors hover:bg-blue-500"
          >
            <span className="font-bold">[ i ]</span> {t('playMode.help')}
          </button>

          <button 
            onClick={() => setIsDevMode(!isDevMode)}
            className={`w-full border-2 font-bold py-2 uppercase tracking-widest transition-colors ${
              isDevMode ? 'border-white bg-white text-gray-900' : 'border-gray-700 bg-transparent text-gray-500 hover:border-gray-400'
            }`}
          >
            {t('playMode.devMode')}: {isDevMode ? t('common.on') : t('common.off')}
          </button>

          {isDevMode && (
            <button
              onClick={() => setIsVarModalOpen(true)}
              className="w-full border-2 border-yellow-500 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500 hover:text-gray-900 font-bold py-2 uppercase tracking-widest transition-colors"
            >
              ⚙ Gerir Variáveis
            </button>
          )}
        </div>

        {isDevMode ? (
          <>
            {/* EXIBIÇÃO DE TAGS DO NÓ */}
            <div className="mb-6">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b border-gray-700 pb-2 mb-3">
                {t('playMode.tags')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {currentTags.length > 0 ? (
                  currentTags.map((tag, i) => (
                    <span 
                      key={i} 
                      className={`px-2 py-1 text-[10px] font-black uppercase border-2 shadow-[2px_2px_0px_#000] ${
                        tag.toLowerCase() === 'secreto' 
                          ? 'bg-purple-500 border-purple-900 text-white' 
                          : 'bg-yellow-400 border-gray-900 text-gray-900'
                      }`}
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-600 italic text-xs font-mono">{t('playMode.noTags')}</span>
                )}
              </div>
            </div>

            {/* EXIBIÇÃO DE VARIÁVEIS ATIVAS */}
            <div className="mb-8">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b border-gray-700 pb-2 mb-4">
                {t('playMode.variables')}
              </h3>
              {Object.keys(currentState).length === 0 ? (
                <p className="text-gray-600 italic">{t('playMode.empty')}</p>
              ) : (
                <ul className="space-y-2 font-mono text-sm">
                  {Object.entries(currentState).map(([key, value]) => (
                    <li key={key} className="flex justify-between border-b border-gray-800 pb-1">
                      <span className="text-blue-300">${key}</span>
                      <span className="font-bold">{String(value)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* HISTÓRICO DE NAVEGAÇÃO */}
            <div className="flex-1">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b border-gray-700 pb-2 mb-4">
                {t('playMode.path')}
              </h3>
              <ul className="space-y-3 font-mono text-xs">
                {history.map((step, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-600 mr-2">{index + 1}.</span>
                    <span className={index === history.length - 1 ? 'text-yellow-400 font-bold underline' : 'text-gray-400'}>
                      {step}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-700 text-sm font-bold uppercase tracking-widest text-center px-4">
            {t('playMode.hiddenDebug')}
          </div>
        )}
      </div>

      {/* Variable editor — only accessible in dev mode */}
      <VariablesModal
        isOpen={isVarModalOpen}
        onClose={() => setIsVarModalOpen(false)}
        variables={currentState}
        setVariables={(newVarsOrUpdater) => {
          setCurrentState(prev => {
            const next = typeof newVarsOrUpdater === 'function'
              ? newVarsOrUpdater(prev)
              : newVarsOrUpdater;
            return next;
          });
        }}
        mode="change"
      />
    </div>
  );
}
// src/components/PlayMode.jsx
import React, { useState, useEffect } from 'react';
import { findStartNode, getInitialState, applyModifiers, canAccessChoice } from '../utils/sugarcubeLogic';
import Minimap from './Minimap';
import { useInfoPopout } from '../contexts/InfoPopoutContext';
// 1. Importar o hook oficial do motor de traduções
import { useTranslation } from 'react-i18next';

export default function PlayMode({ isOpen, onClose, nodes, edges }) {
  // --- ESTADOS DO JOGO ---
  // Guardam a posição atual do jogador, as variáveis processadas, o histórico e o modo de visualização.
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [currentState, setCurrentState] = useState({});
  const [history, setHistory] = useState([]);
  const [isDevMode, setIsDevMode] = useState(false);
  const [hoveredTargets, setHoveredTargets] = useState([]);
  
  const { showInfoPopout } = useInfoPopout();
  // 2. Extrair apenas a função de tradução 't'
  const { t } = useTranslation();

  // --- ESCUTAR ATALHO GLOBAL ---
  // Cria um event listener (Ctrl + Shift + D) para alternar o modo de desenvolvimento sem usar o rato.
  useEffect(() => {
    const handleDevHotkey = () => setIsDevMode(prev => !prev);
    window.addEventListener('triggerDevModeToggle', handleDevHotkey);
    return () => window.removeEventListener('triggerDevModeToggle', handleDevHotkey);
  }, []);

  // --- ARRANQUE DO JOGO ---
  // Quando o modal abre, procura o nó inicial, limpa o estado das variáveis e aplica os valores padrão.
  useEffect(() => {
    if (isOpen) {
      const startNode = findStartNode(nodes);
      if (startNode) {
        const initialState = getInitialState(nodes);
        // Processa as instruções do nó inicial (ex: <<set $ouro = 10>>) antes de mostrar o texto.
        const startState = applyModifiers(startNode.data.content, initialState);
        
        setCurrentNodeId(startNode.id);
        setCurrentState(startState);
        setHistory([startNode.data.label]);
      }
    }
  }, [isOpen, nodes]);

  // Bloqueia a renderização se o modal estiver fechado.
  if (!isOpen) return null;

  // --- OBTER DADOS DO NÓ ATUAL ---
  const currentNode = nodes.find(n => n.id === currentNodeId);
  if (!currentNode) return null;

  // Converte a string de tags num array limpo para facilitar a renderização visual.
  const currentTags = currentNode.data?.tags 
    ? currentNode.data.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== "") 
    : [];

  // --- PROCESSAMENTO DO TEXTO ---
  // Este algoritmo lê o conteúdo do nó, substitui variáveis pelos seus valores reais e remove código técnico.
  const processNarrativeText = (text, state) => {
    if (!text) return "";
    let processedText = text;

    // Passo A: Encontra macros de impressão (ex: <<print $nome>>) e substitui pelo valor na memória.
    processedText = processedText.replace(/<<(?:print|=)\s+(\$|_)([a-zA-Z_][a-zA-Z0-9_]*)\s*>>/g, (match, prefix, varName) => {
      return state[varName] !== undefined ? String(state[varName]) : '';
    });

    // Passo B: Limpa blocos de comentários (/% ... %/), comandos de lógica invisível (<<set ...>>) e as setas de escolha originais.
    processedText = processedText
      .replace(/\/%[\s\S]*?%\//g, '') 
      .replace(/<<[\s\S]*?>>/g, '')   
      .replace(/\[\[.*?\]\]/g, '');   

    // Passo C: Deteta variáveis expostas diretamente no texto (ex: "Tens $ouro moedas") e aplica os valores.
    processedText = processedText.replace(/(\$|_)([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, prefix, varName) => {
      return state[varName] !== undefined ? String(state[varName]) : match; 
    });

    return processedText.trim();
  };

  const narrativeText = processNarrativeText(currentNode.data.content, currentState);

  // --- CÁLCULO DE ESCOLHAS ---
  // Filtra apenas as arestas que saem do nó atual e verifica se a lógica do jogo permite o seu acesso (ex: precisa de chave).
  const outgoingEdges = edges.filter(e => e.source === currentNodeId);
  const allChoices = outgoingEdges.map(edge => {
    const choice = currentNode.data.choices?.find(c => c.id === edge.sourceHandle);
    if (!choice) return null;
    const isAccessible = canAccessChoice(currentNode.data.content, choice.text, currentState);
    return { edge, choice, isAccessible };
  }).filter(Boolean);

  // No modo de desenvolvimento, todas as escolhas são listadas. No modo normal, escondem-se as escolhas inacessíveis.
  const visibleChoices = isDevMode ? allChoices : allChoices.filter(c => c.isAccessible);

  // --- NAVEGAÇÃO ---
  // Processa a mudança de nó quando o jogador clica numa escolha.
  const handleChoiceClick = (targetNodeId) => {
    const nextNode = nodes.find(n => n.id === targetNodeId);
    if (!nextNode) return;
    // Modifica as variáveis do jogo com base no conteúdo do novo nó.
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
    <div className="fixed inset-0 z-50 flex bg-gray-950 text-gray-100 font-sans">
      
      {/* ÁREA DO JOGO PRINCIPAL */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto relative">
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

        <div className="max-w-2xl w-full bg-gray-900 border-2 border-gray-700 rounded-lg p-8 shadow-2xl">
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
              visibleChoices.map(({ edge, choice, isAccessible }) => (
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
                  }`}
                >
                  {!isAccessible && <span className="mr-2 font-black tracking-widest">[{t('playMode.blocked')}]</span>}
                  {choice.text}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* PAINEL LATERAL DE DEPURAÇÃO */}
      <div className="w-80 bg-gray-900 border-l-4 border-gray-700 p-6 flex flex-col overflow-y-auto">
        <div className="mb-8 space-y-3">
          <button onClick={onClose} className="w-full border-2 border-gray-500 hover:border-white text-gray-300 hover:text-white font-bold py-2 uppercase tracking-widest transition-colors">
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
    </div>
  );
}
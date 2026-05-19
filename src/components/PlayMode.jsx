// src/components/PlayMode.jsx
import React, { useState, useEffect } from 'react';
import { findStartNode, getInitialState, applyModifiers, canAccessChoice } from '../utils/sugarcubeLogic';
import Minimap from './Minimap';
import { useInfoPopout } from '../contexts/InfoPopoutContext';

export default function PlayMode({ isOpen, onClose, nodes, edges }) {
  // 1. ESTADOS DO JOGO
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [currentState, setCurrentState] = useState({});
  const [history, setHistory] = useState([]);
  const [isDevMode, setIsDevMode] = useState(false);
  const [hoveredTargets, setHoveredTargets] = useState([]);
  const { showInfoPopout } = useInfoPopout();

  // 2. ESCUTAR ATALHO GLOBAL (Ctrl + Shift + D)
  // Isso permite que o atalho definido no App.jsx funcione aqui dentro
  useEffect(() => {
    const handleDevHotkey = () => setIsDevMode(prev => !prev);
    window.addEventListener('triggerDevModeToggle', handleDevHotkey);
    return () => window.removeEventListener('triggerDevModeToggle', handleDevHotkey);
  }, []);

  // 3. ARRANQUE DO JOGO
  useEffect(() => {
    if (isOpen) {
      const startNode = findStartNode(nodes);
      if (startNode) {
        const initialState = getInitialState(nodes);
        const startState = applyModifiers(startNode.data.content, initialState);
        
        setCurrentNodeId(startNode.id);
        setCurrentState(startState);
        setHistory([startNode.data.label]);
      }
    }
  }, [isOpen, nodes]);

  if (!isOpen) return null;

  // 4. OBTER DADOS DO NÓ ATUAL
  const currentNode = nodes.find(n => n.id === currentNodeId);
  if (!currentNode) return null;

  // Processar Tags do Nó Atual
  const currentTags = currentNode.data?.tags 
    ? currentNode.data.tags.split(',').map(t => t.trim()).filter(t => t !== "") 
    : [];

  // 5. PROCESSAR O TEXTO (Limpeza e Interpolação)
  const processNarrativeText = (text, state) => {
    if (!text) return "";
    let processedText = text;

    // A: Macros de print
    processedText = processedText.replace(/<<(?:print|=)\s+(\$|_)([a-zA-Z_][a-zA-Z0-9_]*)\s*>>/g, (match, prefix, varName) => {
      return state[varName] !== undefined ? String(state[varName]) : '';
    });

    // B: Limpar código técnico
    processedText = processedText
      .replace(/\/%[\s\S]*?%\//g, '') 
      .replace(/<<[\s\S]*?>>/g, '')   
      .replace(/\[\[.*?\]\]/g, '');   

    // C: Naked Variables
    processedText = processedText.replace(/(\$|_)([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, prefix, varName) => {
      return state[varName] !== undefined ? String(state[varName]) : match; 
    });

    return processedText.trim();
  };

  const narrativeText = processNarrativeText(currentNode.data.content, currentState);

  // 6. CALCULAR AS ESCOLHAS
  const outgoingEdges = edges.filter(e => e.source === currentNodeId);
  const allChoices = outgoingEdges.map(edge => {
    const choice = currentNode.data.choices?.find(c => c.id === edge.sourceHandle);
    if (!choice) return null;
    const isAccessible = canAccessChoice(currentNode.data.content, choice.text, currentState);
    return { edge, choice, isAccessible };
  }).filter(Boolean);

  const visibleChoices = isDevMode ? allChoices : allChoices.filter(c => c.isAccessible);

  // 7. NAVEGAÇÃO
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
      <p>O modo normal mostra apenas opções acessíveis. No modo Dev, todas as opções são visíveis para ajudar a testar o fluxo.</p>
      <p>Use <span className="font-bold">Ctrl + Shift + D</span> para alternar o Modo Dev rapidamente.</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex bg-gray-950 text-gray-100 font-sans">
      
      {/* ÁREA DO JOGO */}
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
            {narrativeText || "Nenhum texto narrativo definido nesta passagem."}
          </p>

          <div className="flex flex-col gap-3">
            {visibleChoices.length === 0 ? (
               <div className="text-center italic text-gray-500 border-t-2 border-gray-800 pt-6">
                 Fim da História (Nenhuma saída disponível)
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
                  {!isAccessible && <span className="mr-2 font-black tracking-widest">[BLOQUEADO]</span>}
                  {choice.text}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* PAINEL LATERAL (Debug/Dev) */}
      <div className="w-80 bg-gray-900 border-l-4 border-gray-700 p-6 flex flex-col overflow-y-auto">
        <div className="mb-8 space-y-3">
          <button onClick={onClose} className="w-full border-2 border-gray-500 hover:border-white text-gray-300 hover:text-white font-bold py-2 uppercase tracking-widest transition-colors">
            Terminar Teste
          </button>

          <button
            onClick={() => showInfoPopout({ title: 'Info', content: infoPopoutContent })}
            className="w-full flex items-center justify-center gap-2 border-2 border-blue-500 bg-blue-600 text-white font-bold py-2 uppercase tracking-widest transition-colors hover:bg-blue-500"
          >
            <span>ℹ️</span> Ajuda
          </button>

          <button 
            onClick={() => setIsDevMode(!isDevMode)}
            className={`w-full border-2 font-bold py-2 uppercase tracking-widest transition-colors ${
              isDevMode ? 'border-white bg-white text-gray-900' : 'border-gray-700 bg-transparent text-gray-500 hover:border-gray-400'
            }`}
          >
            Modo Dev: {isDevMode ? 'ON' : 'OFF'}
          </button>
        </div>

        {isDevMode ? (
          <>
            {/* EXIBIÇÃO DE TAGS (Neo-Brutalismo) */}
            <div className="mb-6">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b border-gray-700 pb-2 mb-3">
                Passage Tags
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
                  <span className="text-gray-600 italic text-xs font-mono">Sem tags</span>
                )}
              </div>
            </div>

            {/* VARIÁVEIS */}
            <div className="mb-8">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b border-gray-700 pb-2 mb-4">
                Variáveis
              </h3>
              {Object.keys(currentState).length === 0 ? (
                <p className="text-gray-600 italic">Vazio.</p>
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

            {/* HISTÓRICO */}
            <div className="flex-1">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b border-gray-700 pb-2 mb-4">
                Caminho
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
            Painel de depuração oculto para imersão.
          </div>
        )}
      </div>
    </div>
  );
}
// src/components/PlayMode.jsx
import React, { useState, useEffect } from 'react';
import { findStartNode, getInitialState, applyModifiers, canAccessChoice } from '../utils/sugarcubeLogic';
import Minimap from './Minimap';

export default function PlayMode({ isOpen, onClose, nodes, edges }) {
  // 1. ESTADOS DO JOGO
  // Guardamos o nó onde o jogador está, a sua mochila (variáveis) e o histórico de passos
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [currentState, setCurrentState] = useState({});
  const [history, setHistory] = useState([]);

  // NOVO: Estado para controlar o Modo de Desenvolvedor (por defeito começa desligado para imersão)
  const [isDevMode, setIsDevMode] = useState(false);

  // Guardamos o alvo que o rato está a sobrevoar para destacar no minimapa
  const [hoveredTargets, setHoveredTargets] = useState([]);

  // 2. ARRANQUE DO JOGO
  // Sempre que o PlayMode é aberto, reiniciamos a história para o estado inicial
  useEffect(() => {
    if (isOpen) {
      const startNode = findStartNode(nodes);
      if (startNode) {
        const initialState = getInitialState(nodes);
        // Atualiza o estado com as macros do primeiro nó logo à partida
        const startState = applyModifiers(startNode.data.content, initialState);
        
        setCurrentNodeId(startNode.id);
        setCurrentState(startState);
        setHistory([startNode.data.label]);
      }
    }
  }, [isOpen, nodes]);

  // Se o modal estiver fechado, não renderizamos nada
  if (!isOpen) return null;

  // 3. OBTER DADOS DO NÓ ATUAL
  const currentNode = nodes.find(n => n.id === currentNodeId);
  if (!currentNode) return null;

  // 4. LIMPAR O TEXTO PARA O LEITOR
  // O autor escreve código SugarCube no texto, mas o jogador não deve ler "[[Escolha]]" nem "<<set $ouro = 10>>".
  // Esta função remove todo o código para deixar apenas a narrativa pura.
  const cleanNarrativeText = (text) => {
    if (!text) return "";
    return text
      .replace(/\/%[\s\S]*?%\//g, '') // Remove comentários do SugarCube
      .replace(/<<[\s\S]*?>>/g, '')   // Remove todas as macros (set, if, else, etc)
      .replace(/\[\[.*?\]\]/g, '')    // Remove as hiperligações brutas
      .trim();                        // Remove espaços em branco a mais nas pontas
  };

  const narrativeText = cleanNarrativeText(currentNode.data.content);

  // 5. CALCULAR AS ESCOLHAS DISPONÍVEIS
  // Verificamos quais as arestas que saem deste nó e se a matemática permite ao jogador clicar nelas
  const outgoingEdges = edges.filter(e => e.source === currentNodeId);
  const allChoices = outgoingEdges.map(edge => {
    const choice = currentNode.data.choices?.find(c => c.id === edge.sourceHandle);
    if (!choice) return null;

    // Usamos a nossa biblioteca para saber se a porta está aberta ou trancada
    const isAccessible = canAccessChoice(currentNode.data.content, choice.text, currentState);
    
    return { edge, choice, isAccessible };
  }).filter(Boolean); // Remove nulos

  // NOVO: Filtrar as escolhas visíveis consoante o modo
  // Se for Modo Dev, mostramos todas. Se for o Modo Normal, escondemos as que estão bloqueadas.
  const visibleChoices = isDevMode 
    ? allChoices 
    : allChoices.filter(c => c.isAccessible);

  // 6. AVANÇAR NA HISTÓRIA
  // Função ativada quando o jogador clica num botão de escolha
  const handleChoiceClick = (targetNodeId) => {
    const nextNode = nodes.find(n => n.id === targetNodeId);
    if (!nextNode) return;

    // Atualiza a mochila lendo o código do novo nó
    const newState = applyModifiers(nextNode.data.content, currentState);
    
    setCurrentState(newState);
    setCurrentNodeId(targetNodeId);
    setHistory(prev => [...prev, nextNode.data.label]); // Adiciona o nó ao mapa textual
  };

  return (
    // Fundo escuro a cobrir a aplicação inteira
    <div className="fixed inset-0 z-50 flex bg-gray-950 text-gray-100 font-sans">
      
      {/* COLUNA ESQUERDA: A ÁREA DE LEITURA (O Jogo) */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto relative">
        
        {/* O minimapa só é desenhado se o Modo Dev estiver ativo */}
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
            {/* Usamos agora o array visibleChoices em vez do antigo availableChoices */}
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
                  {/* Prefixo de bloqueio apenas aparece no Modo Dev quando a opção está desativada */}
                  {!isAccessible && <span className="mr-2 font-black tracking-widest">[BLOQUEADO]</span>}
                  {choice.text}
                </button>
              ))
            )
            }
          </div>
        </div>
      </div>

      {/* COLUNA DIREITA: PAINEL DE CONTROLO */}
      <div className="w-80 bg-gray-900 border-l-4 border-gray-700 p-6 flex flex-col overflow-y-auto">
        
        <div className="mb-8 space-y-3">
          {/* Botão de Fechar */}
          <button 
            onClick={onClose}
            className="w-full border-2 border-gray-500 hover:border-white text-gray-300 hover:text-white font-bold py-2 uppercase tracking-widest transition-colors"
          >
            Terminar Teste
          </button>

          {/* Botão para alternar o Modo Dev */}
          <button 
            onClick={() => setIsDevMode(!isDevMode)}
            className={`w-full border-2 font-bold py-2 uppercase tracking-widest transition-colors ${
              isDevMode 
                ? 'border-white bg-white text-gray-900' 
                : 'border-gray-700 bg-transparent text-gray-500 hover:border-gray-400'
            }`}
          >
            Modo Dev: {isDevMode ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Os blocos de depuração (Variáveis e Histórico) só existem no Modo Dev */}
        {isDevMode ? (
          <>
            {/* Variáveis em tempo real */}
            <div className="mb-8">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b border-gray-700 pb-2 mb-4">
                Variáveis Atuais
              </h3>
              {Object.keys(currentState).length === 0 ? (
                <p className="text-gray-600 italic">Mochila vazia.</p>
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

            {/* Histórico de Passos */}
            <div className="flex-1">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b border-gray-700 pb-2 mb-4">
                Caminho Percorrido
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
          /* Mensagem para preencher o espaço quando o Modo Dev está desligado */
          <div className="flex-1 flex items-center justify-center text-gray-700 text-sm font-bold uppercase tracking-widest text-center px-4">
            Painel de depuração oculto para imersão narrativa.
          </div>
        )}

      </div>
    </div>
  );
}
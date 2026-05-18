import React from 'react';
// 1. Importar o contexto para permitir a abertura da janela de ajuda
import { useInfoPopout } from '../contexts/InfoPopoutContext';

export default function SettingsModal({ isOpen, onClose, settings, toggleSetting, resetProject }) {
  // 2. Extrair a função de mostrar o popout do contexto
  const { showInfoPopout } = useInfoPopout();

  // Se o modal não estiver aberto, o React não desenha nada no ecrã
  if (!isOpen) return null;

  // 3. Função auxiliar que formata os dados e chama o popout central
  const openHelp = (title, subtitle, content) => {
    showInfoPopout({ title, subtitle, content });
  };

  // 4. Estilo unificado para os botões de ajuda (versão mais pequena para caber nas listas)
  const helpButtonClass = "w-6 h-6 flex items-center justify-center border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-black hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none cursor-pointer text-xs";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Alargado de w-80 para w-96 para acomodar os novos botões sem sobreposição */}
      <div className="bg-white dark:bg-gray-800 border-4 border-gray-900 dark:border-gray-200 p-6 w-96 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]">
        
        <div className="flex justify-between items-center border-b-2 border-gray-900 dark:border-gray-200 pb-2 mb-4">
          <h2 className="font-black uppercase tracking-widest text-lg text-gray-900 dark:text-gray-100">Definições</h2>
          <button onClick={onClose} className="font-bold hover:text-red-600 dark:hover:text-red-400 transition-colors text-gray-900 dark:text-gray-100">X</button>
        </div>

        <div className="space-y-4">

          {/* --- SECÇÃO: VISUALIZAÇÃO --- */}
          <div className="border-t-2 border-gray-900 dark:border-gray-200 my-2 pt-2">
            <span className="font-black uppercase tracking-widest text-xs text-gray-500 dark:text-gray-400">Visualização</span>
          </div>

          {/* Opção: Nós Secretos */}
          <div className="flex items-center justify-between">
            {/* O texto e o botão de ajuda ficam agrupados à esquerda */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm uppercase text-gray-900 dark:text-gray-100">Nós Secretos</span>
              <button
                type="button"
                onClick={() => openHelp(
                  'Nós Secretos',
                  'Visibilidade de nós de sistema',
                  <p>Liga ou desliga a visualização no grafo de nós especiais do Twine, como o StoryInit ou StoryData. Desligar ajuda a despoluir o ecrã enquanto escreves a história.</p>
                )}
                className={helpButtonClass}
                aria-label="Ajuda Nós Secretos"
              >
                ?
              </button>
            </div>
            {/* O interruptor fica encostado à direita */}
            <button 
              onClick={() => toggleSetting('showSecrets')}
              className={`w-12 h-6 border-2 border-gray-900 dark:border-gray-200 transition-colors relative ${settings.showSecrets ? 'bg-green-400 dark:bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-100 transition-all ${settings.showSecrets ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Opção: Alertas de Fluxo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm uppercase text-gray-900 dark:text-gray-100">Alertas de Fluxo</span>
              <button
                type="button"
                onClick={() => openHelp(
                  'Alertas de Fluxo',
                  'Avisos de erros lógicos',
                  <p>Controla a caixa vermelha no painel de dados. Se estiver ativo, o sistema avisa-te quando existirem opções bloqueadas permanentemente ou secções de texto inatingíveis.</p>
                )}
                className={helpButtonClass}
                aria-label="Ajuda Alertas de Fluxo"
              >
                ?
              </button>
            </div>
            <button 
              onClick={() => toggleSetting('showFlowErrors')}
              className={`w-12 h-6 border-2 border-gray-900 dark:border-gray-200 transition-colors relative ${settings.showFlowErrors ? 'bg-green-400 dark:bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-100 transition-all ${settings.showFlowErrors ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>


          {/* --- SECÇÃO: DESENVOLVIMENTO --- */}
          <div className="border-t-2 border-gray-900 dark:border-gray-200 my-2 pt-2">
            <span className="font-black uppercase tracking-widest text-xs text-gray-500 dark:text-gray-400">Dev</span>
          </div>

          {/* Opção: Lista de Adjacência */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm uppercase text-gray-900 dark:text-gray-100">Lista Adjacência</span>
              <button
                type="button"
                onClick={() => openHelp(
                  'Lista de Adjacência',
                  'Estrutura matemática do grafo',
                  <p>Abre um painel técnico no motor de dados que mostra como os nós estão interligados por trás do ecrã. Útil para depurar o algoritmo de rotas.</p>
                )}
                className={helpButtonClass}
                aria-label="Ajuda Lista de Adjacência"
              >
                ?
              </button>
            </div>
            <button 
              onClick={() => toggleSetting('showAdjacency')}
              className={`w-12 h-6 border-2 border-gray-900 dark:border-gray-200 transition-colors relative ${settings.showAdjacency ? 'bg-green-400 dark:bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-100 transition-all ${settings.showAdjacency ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Opção: Simulação Dev */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm uppercase text-gray-900 dark:text-gray-100">Simulação Dev</span>
              <button
                type="button"
                onClick={() => openHelp(
                  'Simulação Dev',
                  'Testes via consola do browser',
                  <p>Ativa um botão para correr simulações de todos os caminhos possíveis invisivelmente. Os resultados são impressos na consola do navegador (tecla F12).</p>
                )}
                className={helpButtonClass}
                aria-label="Ajuda Simulação Dev"
              >
                ?
              </button>
            </div>
            <button
              onClick={() => toggleSetting('showSimulationLegacy')}
              className={`w-12 h-6 border-2 border-gray-900 dark:border-gray-200 transition-colors relative ${settings.showSimulationLegacy ? 'bg-green-400 dark:bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-100 transition-all ${settings.showSimulationLegacy ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>  
        </div>

        {/* --- SECÇÃO: ZONA DE PERIGO --- */}
        <div className="mt-6 border-t-2 border-gray-900 dark:border-gray-200 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-black text-red-600 uppercase">Zona de Perigo</h3>
            <button
              type="button"
              onClick={() => openHelp(
                'Apagar Projeto',
                'Atenção: Ação irreversível',
                <p>Este botão destrói permanentemente todos os dados não exportados da aplicação, limpando o armazenamento local do navegador e reiniciando a página em branco.</p>
              )}
              className="w-6 h-6 flex items-center justify-center border-2 border-red-600 bg-red-100 text-red-600 font-black hover:bg-red-200 transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#dc2626] active:shadow-none cursor-pointer text-xs"
              aria-label="Ajuda Zona Perigo"
            >
              !
            </button>
          </div>
          
          {/* Botão de reset atualizado para seguir o design do projeto */}
          <button
            onClick={resetProject}
            className="w-full border-2 border-red-600 bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700 transition-colors shadow-[4px_4px_0px_rgba(220,38,38,0.3)] active:translate-y-0.5 active:shadow-none uppercase tracking-widest"
          >
            Limpar Cache e Reset
          </button>
        </div>
        
        {/* Botão de fechar o modal */}
        <button 
          onClick={onClose}
          className="w-full mt-6 p-2 border-2 border-gray-900 bg-gray-900 text-white font-bold uppercase text-xs hover:bg-gray-700 transition-colors shadow-[4px_4px_0px_#000] active:translate-y-0.5 active:shadow-none"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
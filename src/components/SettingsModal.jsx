import React from 'react';
// 1. Importar o contexto para permitir a abertura da janela de ajuda
import { useInfoPopout } from '../contexts/InfoPopoutContext';
// Importação corrigida para o motor de traduções oficial
import { useTranslation } from 'react-i18next';

export default function SettingsModal({ isOpen, onClose, settings, toggleSetting, resetProject }) {
  // 2. Extrair a função de mostrar o popout do contexto
  const { showInfoPopout } = useInfoPopout();
  // Hook atualizado
  const { t, i18n } = useTranslation();

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
          <h2 className="font-black uppercase tracking-widest text-lg text-gray-900 dark:text-gray-100">{t('settingsModal.title')}</h2>
        </div>

        <div className="space-y-4">

          <div className="flex items-center justify-between pb-2">
            <span className="font-bold text-sm uppercase text-gray-900 dark:text-gray-100">Idioma / Language</span>
            <button
              onClick={() => i18n.changeLanguage((i18n.language || 'en').startsWith('en') ? 'pt' : 'en')}
              className="px-4 py-1 border-2 border-gray-900 dark:border-gray-200 bg-gray-200 dark:bg-gray-700 font-black text-xs uppercase hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            >
              {(i18n.language || 'en').startsWith('en') ? 'Português (PT)' : 'English (EN)'}
            </button>
          </div>

          {/* --- SECÇÃO: VISUALIZAÇÃO --- */}
          <div className="border-t-2 border-gray-900 dark:border-gray-200 my-2 pt-2">
            <span className="font-black uppercase tracking-widest text-xs text-gray-500 dark:text-gray-400">{t('settingsModal.visualization')}</span>
          </div>

          {/* Opção: Nós Secretos */}
          <div className="flex items-center justify-between">
            {/* O texto e o botão de ajuda ficam agrupados à esquerda */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm uppercase text-gray-900 dark:text-gray-100">{t('settingsModal.secretNodes')}</span>
              <button
                type="button"
                onClick={() => openHelp(
                  t('settingsModal.help.secretNodes.title'),
                  t('settingsModal.help.secretNodes.subtitle'),
                  <p>{t('settingsModal.help.secretNodes.text')}</p>
                )}
                className={helpButtonClass}
                aria-label={t('settingsModal.help.secretNodes.aria')}
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
              <span className="font-bold text-sm uppercase text-gray-900 dark:text-gray-100">{t('settingsModal.flowAlerts')}</span>
              <button
                type="button"
                onClick={() => openHelp(
                  t('settingsModal.help.flowAlerts.title'),
                  t('settingsModal.help.flowAlerts.subtitle'),
                  <p>{t('settingsModal.help.flowAlerts.text')}</p>
                )}
                className={helpButtonClass}
                aria-label={t('settingsModal.help.flowAlerts.aria')}
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

          {/* Opção: Editor de Lógica Visual */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm uppercase text-gray-900 dark:text-gray-100">{t('settingsModal.visualLogic')}</span>
              <button
                type="button"
                onClick={() => openHelp(
                  t('settingsModal.help.visualLogic.title'),
                  t('settingsModal.help.visualLogic.subtitle'),
                  <p>{t('settingsModal.help.visualLogic.text')}</p>
                )}
                className={helpButtonClass}
                aria-label={t('settingsModal.help.visualLogic.aria')}
              >
                ?
              </button>
            </div>
            <button
              onClick={() => toggleSetting('visualLogicEnabled')}
              className={`w-12 h-6 border-2 border-gray-900 dark:border-gray-200 transition-colors relative ${settings.visualLogicEnabled ? 'bg-green-400 dark:bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-100 transition-all ${settings.visualLogicEnabled ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>


          {/* --- SECÇÃO: DESENVOLVIMENTO --- */}
          <div className="border-t-2 border-gray-900 dark:border-gray-200 my-2 pt-2">
            <span className="font-black uppercase tracking-widest text-xs text-gray-500 dark:text-gray-400">{t('settingsModal.dev')}</span>
          </div>

          {/* Opção: Lista de Adjacência */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm uppercase text-gray-900 dark:text-gray-100">{t('settingsModal.adjacencyList')}</span>
              <button
                type="button"
                onClick={() => openHelp(
                  t('settingsModal.help.adjacencyList.title'),
                  t('settingsModal.help.adjacencyList.subtitle'),
                  <p>{t('settingsModal.help.adjacencyList.text')}</p>
                )}
                className={helpButtonClass}
                aria-label={t('settingsModal.help.adjacencyList.aria')}
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
              <span className="font-bold text-sm uppercase text-gray-900 dark:text-gray-100">{t('settingsModal.devSimulation')}</span>
              <button
                type="button"
                onClick={() => openHelp(
                  t('settingsModal.help.devSimulation.title'),
                  t('settingsModal.help.devSimulation.subtitle'),
                  <p>{t('settingsModal.help.devSimulation.text')}</p>
                )}
                className={helpButtonClass}
                aria-label={t('settingsModal.help.devSimulation.aria')}
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
            <h3 className="text-sm font-black text-red-600 uppercase">{t('settingsModal.dangerZone')}</h3>
            <button
              type="button"
              onClick={() => openHelp(
                t('settingsModal.help.dangerZone.title'),
                t('settingsModal.help.dangerZone.subtitle'),
                <p>{t('settingsModal.help.dangerZone.text')}</p>
              )}
              className="w-6 h-6 flex items-center justify-center border-2 border-red-600 bg-red-100 text-red-600 font-black hover:bg-red-200 transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#dc2626] active:shadow-none cursor-pointer text-xs"
              aria-label={t('settingsModal.help.dangerZone.aria')}
            >
              !
            </button>
          </div>

          <button
            onClick={resetProject}
            className="w-full border-2 border-red-600 bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700 transition-colors shadow-[4px_4px_0px_rgba(220,38,38,0.3)] active:translate-y-0.5 active:shadow-none uppercase tracking-widest"
          >
            {t('settingsModal.resetButton')}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 p-2 border-2 border-gray-900 bg-gray-900 text-white font-bold uppercase text-xs hover:bg-gray-700 transition-colors shadow-[4px_4px_0px_#000] active:translate-y-0.5 active:shadow-none"
        >
          {t('settingsModal.close')}
        </button>
      </div>
    </div>
  );
}
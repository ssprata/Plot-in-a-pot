import React from 'react';
// 1. Importar o contexto para permitir a abertura da janela de ajuda
import { useInfoPopout } from '../contexts/InfoPopoutContext';
// Importação corrigida para o motor de traduções oficial
import { useTranslation } from 'react-i18next';

export default function SettingsModal({ isOpen, onClose, settings, toggleSetting, updateSetting, resetProject, openTutorialMenu }) {
  // 2. Extrair a função de mostrar o popout do contexto
  const { showInfoPopout } = useInfoPopout();
  // Hook atualizado
  const { t, i18n } = useTranslation();

  const [currentLang, setCurrentLang] = React.useState(i18n.language || 'en');

  React.useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setCurrentLang(lng);
    };
    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  // Se o modal não estiver aberto, o React não desenha nada no ecrã
  if (!isOpen) return null;

  // 3. Função auxiliar que formata os dados e chama o popout central
  const openHelp = (title, subtitle, content) => {
    showInfoPopout({ title, subtitle, content });
  };

  // 4. Estilo unificado para os botões de ajuda (versão mais pequena para caber nas listas)
  const helpButtonClass = "w-6 h-6 flex shrink-0 items-center justify-center border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-black hover:bg-yellow-400 dark:hover:bg-yellow-400 transition-all active:translate-y-0.5 shadow-[1px_1px_0px_#000] dark:shadow-[1px_1px_0px_#fff] active:shadow-none rounded-full cursor-pointer text-xs";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Alargado de w-80 para w-96 para acomodar os novos botões sem sobreposição */}
      <div className="bg-white dark:bg-gray-800 border-4 border-gray-900 dark:border-gray-200 p-6 w-96 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]">

        <div className="flex justify-between items-center border-b-2 border-gray-900 dark:border-gray-200 pb-2 mb-4">
          <h2 className="font-black uppercase tracking-widest text-lg text-gray-900 dark:text-gray-100">{t('settingsModal.title')}</h2>
        </div>

        <div className="space-y-4">

          <div className="flex flex-col gap-2 pb-2">
            <span className="font-bold text-sm uppercase text-gray-900 dark:text-gray-100">Idioma / Language</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => i18n.changeLanguage('en')}
                className={`flex-1 py-1.5 border-2 border-gray-900 dark:border-gray-200 font-black text-xs uppercase transition-all cursor-pointer shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none ${
                  currentLang.startsWith('en')
                    ? 'bg-yellow-400 text-gray-950 dark:bg-yellow-400 dark:text-gray-950'
                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                }`}
              >
                English (EN)
              </button>
              <button
                type="button"
                onClick={() => i18n.changeLanguage('pt')}
                className={`flex-1 py-1.5 border-2 border-gray-900 dark:border-gray-200 font-black text-xs uppercase transition-all cursor-pointer shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none ${
                  currentLang.startsWith('pt')
                    ? 'bg-yellow-400 text-gray-950 dark:bg-yellow-400 dark:text-gray-950'
                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                }`}
              >
                Português (PT)
              </button>
            </div>
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

          {/* Opção: Desfoque da Imagem */}
          <div className="flex flex-col gap-1 pb-2 border-b border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm uppercase text-gray-900 dark:text-gray-100">
                {t('settingsModal.bgImageBlur', 'Desfoque da Imagem')}
              </span>
              <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 border-2 border-gray-900 dark:border-gray-200 text-gray-900 dark:text-gray-100 shadow-[1px_1px_0px_#000] dark:shadow-[1px_1px_0px_#fff]">
                {settings.bgImageBlur ?? 5}px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={settings.bgImageBlur ?? 5}
              onChange={(e) => updateSetting('bgImageBlur', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-none appearance-none cursor-pointer accent-blue-600 border-2 border-gray-900 dark:border-gray-200"
            />
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

          {/* Opção: Simulação na Validação */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm uppercase text-gray-900 dark:text-gray-100">{t('settingsModal.showSimulationOnValidation', 'Simulação na Validação')}</span>
              <button
                type="button"
                onClick={() => openHelp(
                  t('settingsModal.help.showSimulationOnValidation.title', 'Simulação na Validação'),
                  t('settingsModal.help.showSimulationOnValidation.subtitle', 'Visualizar caminhos e variáveis'),
                  <p>{t('settingsModal.help.showSimulationOnValidation.text', 'Quando ativo, exibe a travessia detalhada de todos os caminhos e variáveis no modal de validação e no painel lateral.')}</p>
                )}
                className={helpButtonClass}
                aria-label={t('settingsModal.help.showSimulationOnValidation.aria', 'Help Simulation on Validation')}
              >
                ?
              </button>
            </div>
            <button
              onClick={() => toggleSetting('showSimulationOnValidation')}
              className={`w-12 h-6 border-2 border-gray-900 dark:border-gray-200 transition-colors relative ${settings.showSimulationOnValidation ? 'bg-green-400 dark:bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-100 transition-all ${settings.showSimulationOnValidation ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
        </div>

        {/* --- SECÇÃO: TUTORIAL --- */}
        {!localStorage.getItem('plot-in-a-pot-tutorial-completed') && (
          <div className="mt-4 border-t-2 border-gray-900 dark:border-gray-200 pt-4">
            <button
              onClick={() => {
                if (openTutorialMenu) openTutorialMenu();
              }}
              className="w-full border-2 border-gray-900 dark:border-gray-200 bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-black px-4 py-2 text-sm transition-all shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] active:translate-y-0.5 active:shadow-none uppercase tracking-widest cursor-pointer font-sans"
            >
              🎓 {t('settingsModal.startTutorialButton', 'Fazer tutorial')}
            </button>
          </div>
        )}

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
              className="w-6 h-6 flex items-center justify-center border-2 border-red-600 bg-red-100 text-red-600 font-black hover:bg-red-200 transition-all active:translate-y-0.5 shadow-[1px_1px_0px_#dc2626] dark:shadow-[1px_1px_0px_#fff] active:shadow-none rounded-full cursor-pointer text-xs"
              aria-label={t('settingsModal.help.dangerZone.aria')}
            >
              !
            </button>
          </div>

          <button
            onClick={resetProject}
            className="w-full border-2 border-red-600 dark:border-red-400 bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-750 transition-all shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] active:translate-y-0.5 active:shadow-none uppercase tracking-widest cursor-pointer"
          >
            {t('settingsModal.resetButton')}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 p-2 border-2 border-gray-900 bg-gray-950 text-white font-bold uppercase text-xs hover:bg-gray-850 dark:border-gray-200 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100 transition-all shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] active:translate-y-0.5 active:shadow-none cursor-pointer"
        >
          {t('settingsModal.close')}
        </button>
      </div>
    </div>
  );
}
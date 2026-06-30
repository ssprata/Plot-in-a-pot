import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useInfoPopout } from '../contexts/InfoPopoutContext';
// IMPORTAÇÃO CORRIGIDA: Usa o hook oficial do react-i18next
import { useTranslation } from 'react-i18next';

export default function TopBar({
  addNode, openSettings, openPlayMode, openAiModal, openTutorialMenu,
  canUndo, canRedo, activeStep
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { isDark, toggleTheme } = useTheme();
  const { showInfoPopout } = useInfoPopout();
  
  // HOOK CORRIGIDO: Agora usamos o 't' para traduzir e o 'i18n' para controlar o motor
  const { t } = useTranslation();

  const openHelp = (title, subtitle, content) => {
    showInfoPopout({ title, subtitle, content });
  };

  // Fechar o menu ao clicar fora dele
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleSpecialNode = (label) => {
    addNode('choice', label, 'secreto');
    setIsDropdownOpen(false);
  };

  const isTutorialActive = !!activeStep;

  // Checks for disabling buttons during walkthrough
  const isAddSceneDisabled = isTutorialActive && activeStep?.allowAddNode !== 'choice';
  const isAddScriptDisabled = isTutorialActive && activeStep?.allowAddNode !== 'javascript';
  const isAddStyleDisabled = isTutorialActive && activeStep?.allowAddNode !== 'css';
  const isAddZoneDisabled = isTutorialActive && activeStep?.allowAddNode !== 'zone';
  const isSystemMenuDisabled = isTutorialActive && !activeStep?.allowSystemMenu;
  const isAiDisabled = isTutorialActive && !activeStep?.allowAi;
  const isPlayDisabled = isTutorialActive && !activeStep?.allowPlay;
  const isSettingsDisabled = isTutorialActive && !activeStep?.allowSettings;

  const helpButtonClass = "w-5 h-5 flex shrink-0 items-center justify-center border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-black hover:bg-yellow-400 dark:hover:bg-yellow-400 transition-all active:translate-y-0.5 shadow-[1px_1px_0px_#000] dark:shadow-[1px_1px_0px_#fff] active:shadow-none rounded-full cursor-pointer text-[10px]";

  return (
    <div className="p-2 border-b-4 border-gray-900 dark:border-gray-200 flex gap-2 bg-white dark:bg-gray-800 items-center shadow-sm z-50 relative">
      <div className="flex gap-2">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => addNode('choice')} 
            disabled={isAddSceneDisabled}
            className={`px-4 py-2 border-2 border-gray-900 dark:border-gray-200 bg-emerald-200 hover:bg-emerald-300 text-emerald-950 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white font-black text-xs uppercase tracking-wider transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none rounded-none ${
              isAddSceneDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
            } ${activeStep?.highlightButton === 'addScene' ? 'tutorial-btn-flash' : ''}`}
          >
            {t('topBar.addScene')}
          </button>
          <button
            type="button"
            onClick={() => openHelp(
              t('topBar.helpTitles.addScene'),
              t('topBar.helpSubtitles.addScene'),
              <p>{t('topBar.helpDescription.addScene')}<br/><br/><b>{t('hotkeys.addScene')}</b></p>
            )}
            className={helpButtonClass}
            aria-label={t('topBar.helpLabels.addScene')}
          >
            ?
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => addNode('zone')} 
            disabled={isAddZoneDisabled}
            className={`px-4 py-2 border-2 border-gray-900 dark:border-gray-200 bg-amber-200 hover:bg-amber-300 text-amber-950 dark:bg-amber-900 dark:hover:bg-amber-800 dark:text-amber-100 font-black text-xs uppercase tracking-wider transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none rounded-none ${
              isAddZoneDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
            }`}
          >
            {t('topBar.addZone')}
          </button>
          <button
            type="button"
            onClick={() => openHelp(
              t('topBar.helpTitles.addZone'),
              t('topBar.helpSubtitles.addZone'),
              <p>{t('topBar.helpDescription.addZone')}<br/><br/><b>{t('hotkeys.addZone')}</b></p>
            )}
            className={helpButtonClass}
            aria-label={t('topBar.helpLabels.addZone')}
          >
            ?
          </button>
        </div>

        <div className="relative flex items-center gap-1" ref={dropdownRef}>
          <button 
            onClick={() => { if (!isSystemMenuDisabled) setIsDropdownOpen(!isDropdownOpen); }}
            disabled={isSystemMenuDisabled}
            className={`px-4 py-2 border-2 border-gray-900 dark:border-gray-200 bg-purple-200 hover:bg-purple-300 text-purple-950 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-100 font-black text-xs uppercase tracking-wider transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none rounded-none flex items-center gap-2 ${
              isSystemMenuDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
            } ${activeStep?.highlightButton === 'systemMenu' ? 'tutorial-btn-flash' : ''}`}
          >
            {t('topBar.systemMenu')}
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => openHelp(
              t('topBar.helpTitles.systemMenu', 'System & Code Nodes'),
              t('topBar.helpSubtitles.systemMenu', 'System config and scripting nodes'),
              <p>{t('topBar.helpDescription.systemMenu', 'StoryInit, StoryTitle, StoryData, StoryCaption, JavaScript and CSS styles.')}</p>
            )}
            className={helpButtonClass}
            aria-label={t('topBar.helpLabels.systemMenu', 'Help System & Code')}
          >
            ?
          </button>
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 border-2 border-gray-800 dark:border-gray-200 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] flex flex-col z-50">
              <button onClick={() => handleSpecialNode('StoryInit')} className="p-2 text-left text-xs font-bold uppercase hover:bg-gray-100 dark:hover:bg-gray-700 border-b-2 border-gray-800 dark:border-gray-200" title="StoryInit (Ctrl + Alt + I)">
                StoryInit
              </button>
              <button onClick={() => handleSpecialNode('StoryTitle')} className="p-2 text-left text-xs font-bold uppercase hover:bg-gray-100 dark:hover:bg-gray-700 border-b-2 border-gray-800 dark:border-gray-200" title="StoryTitle (Ctrl + Alt + T)">
                StoryTitle
              </button>
              <button onClick={() => handleSpecialNode('StoryData')} className="p-2 text-left text-xs font-bold uppercase hover:bg-gray-100 dark:hover:bg-gray-700 border-b-2 border-gray-800 dark:border-gray-200" title="StoryData (Ctrl + Alt + D)">
                StoryData
              </button>
              <button onClick={() => handleSpecialNode('StoryCaption')} className="p-2 text-left text-xs font-bold uppercase hover:bg-gray-100 dark:hover:bg-gray-700 border-b-2 border-gray-800 dark:border-gray-200" title="StoryCaption (Ctrl + Alt + C)">
                StoryCaption
              </button>
              <button 
                onClick={() => { addNode('javascript'); setIsDropdownOpen(false); }} 
                disabled={isAddScriptDisabled}
                className={`p-2 text-left text-xs font-bold uppercase hover:bg-gray-100 dark:hover:bg-gray-700 border-b-2 border-gray-800 dark:border-gray-200 ${
                  isAddScriptDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
                }`}
                title="JavaScript"
              >
                {t('topBar.addScript')}
              </button>
              <button 
                onClick={() => { addNode('css'); setIsDropdownOpen(false); }} 
                disabled={isAddStyleDisabled}
                className={`p-2 text-left text-xs font-bold uppercase hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  isAddStyleDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
                }`}
                title="CSS"
              >
                {t('topBar.addStyle')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-4">

        <div className="flex items-center gap-1">
          <button 
            onClick={openAiModal}
            disabled={isAiDisabled}
            className={`px-4 py-2 border-2 border-gray-900 dark:border-gray-200 bg-pink-200 hover:bg-pink-300 text-pink-950 dark:bg-pink-900 dark:hover:bg-pink-800 dark:text-pink-100 font-black text-xs uppercase tracking-widest transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none rounded-none flex items-center gap-2 ${
              isAiDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
            }`}
          >
            {t('topBar.generateAi')}
          </button>
          <button
            type="button"
            onClick={() => openHelp(
              t('topBar.helpTitles.generateAi'),
              t('topBar.helpSubtitles.generateAi'),
              <p>{t('topBar.helpDescription.generateAi')}<br/><br/><b>{t('hotkeys.generateAi')}</b></p>
            )}
            className={helpButtonClass}
            aria-label={t('topBar.helpLabels.generateAi')}
          >
            ?
          </button>
        </div>



        <div className="hidden md:block font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 select-none">
          {t('topBar.doubleClickHint')}
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={toggleTheme}
            className="p-2 border-2 border-gray-900 bg-yellow-200 hover:bg-yellow-300 text-yellow-950 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-200 transition-colors shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none rounded-none"
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => openHelp(
              t('topBar.helpTitles.theme'),
              t('topBar.helpSubtitles.theme'),
              <p>{t('topBar.helpDescription.theme')}<br/><br/><b>{t('hotkeys.settings')}</b></p>
            )}
            className={helpButtonClass}
            aria-label={t('topBar.helpLabels.theme')}
          >
            ?
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={openTutorialMenu}
            className="px-3 py-2 border-2 border-gray-900 bg-cyan-200 hover:bg-cyan-300 text-cyan-950 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-200 font-black text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none rounded-none cursor-pointer"
          >
            🎓 {t('topBar.tutorial', 'Tutorial')}
          </button>
          <button
            type="button"
            onClick={() => openHelp(
              t('topBar.helpTitles.tutorial', 'Tutorial'),
              t('topBar.helpSubtitles.tutorial', 'Interactive Guided Tours'),
              <p>{t('topBar.helpDescription.tutorial', 'Opens the interactive guided tutorial menu to help you learn how to use the tool step by step.')}</p>
            )}
            className={helpButtonClass}
          >
            ?
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={openSettings}
            disabled={isSettingsDisabled}
            className={`p-2 border-2 border-gray-900 bg-orange-200 hover:bg-orange-300 text-orange-950 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-200 transition-colors shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none ${
              isSettingsDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
            } ${activeStep?.highlightButton === 'settings' ? 'tutorial-btn-flash' : ''}`}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => openHelp(
              t('topBar.helpTitles.settings'),
              t('topBar.helpSubtitles.settings'),
              <p>{t('topBar.helpDescription.settings')}<br/><br/><b>{t('hotkeys.settings')}</b></p>
            )}
            className={helpButtonClass}
            aria-label={t('topBar.helpLabels.settings')}
          >
            ?
          </button>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useInfoPopout } from '../contexts/InfoPopoutContext';
// IMPORTAÇÃO CORRIGIDA: Usa o hook oficial do react-i18next
import { useTranslation } from 'react-i18next';

export default function TopBar({ addNode, openSettings, openPlayMode, openAiModal, openTutorialMenu }) {
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

  const helpButtonClass = "w-8 h-8 flex items-center justify-center border-2 border-gray-800 dark:border-gray-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-black hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none cursor-pointer";

  return (
    <div className="p-2 border-b-2 border-gray-300 dark:border-gray-600 flex gap-2 bg-white dark:bg-gray-800 items-center shadow-sm z-50 relative">
      <div className="flex gap-2">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => addNode('choice')} 
            className="px-4 py-2 border-2 border-gray-800 dark:border-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-bold text-xs uppercase tracking-wider transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none"
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
            onClick={() => addNode('javascript')} 
            className="px-4 py-2 border-2 border-gray-800 dark:border-gray-200 bg-indigo-50 dark:bg-indigo-900 hover:bg-indigo-100 dark:hover:bg-indigo-800 text-indigo-900 dark:text-indigo-100 font-bold text-xs uppercase tracking-wider transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none"
          >
            {t('topBar.addScript')}
          </button>
          <button
            type="button"
            onClick={() => openHelp(
              t('topBar.helpTitles.addScript'),
              t('topBar.helpSubtitles.addScript'),
              <p>{t('topBar.helpDescription.addScript')}<br/><br/><b>{t('hotkeys.addScript')}</b></p>
            )}
            className={helpButtonClass}
            aria-label={t('topBar.helpLabels.addScript')}
          >
            ?
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => addNode('css')} 
            className="px-4 py-2 border-2 border-gray-800 dark:border-gray-200 bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800 text-green-900 dark:text-green-100 font-bold text-xs uppercase tracking-wider transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none"
          >
            {t('topBar.addStyle')}
          </button>
          <button
            type="button"
            onClick={() => openHelp(
              t('topBar.helpTitles.addStyle'),
              t('topBar.helpSubtitles.addStyle'),
              <p>{t('topBar.helpDescription.addStyle')}<br/><br/><b>{t('hotkeys.addStyle')}</b></p>
            )}
            className={helpButtonClass}
            aria-label={t('topBar.helpLabels.addStyle')}
          >
            ?
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => addNode('zone')} 
            className="px-4 py-2 border-2 border-gray-800 dark:border-gray-200 bg-amber-50 dark:bg-amber-900 hover:bg-amber-100 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100 font-bold text-xs uppercase tracking-wider transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none"
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
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="px-4 py-2 border-2 border-gray-800 dark:border-gray-200 bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 dark:hover:bg-purple-800 text-purple-900 dark:text-purple-100 font-bold text-xs uppercase tracking-wider transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none flex items-center gap-2"
          >
            {t('topBar.systemMenu')}
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        <button
            type="button"
            onClick={() => openHelp(
              t('topBar.helpTitles.systemMenu'),
              t('topBar.helpSubtitles.systemMenu'),
              <div className="space-y-2">
                <p>{t('topBar.helpSystem.intro')}</p>
                <ul className="list-disc pl-5 space-y-2 text-sm mt-2">
                  <li><strong>StoryInit:</strong> {t('topBar.helpSystem.storyInit')}</li>
                  <li><strong>StoryTitle:</strong> {t('topBar.helpSystem.storyTitle')}</li>
                  <li><strong>StoryData:</strong> {t('topBar.helpSystem.storyData')}</li>
                  <li><strong>StoryCaption:</strong> {t('topBar.helpSystem.storyCaption')}</li>
                </ul>
                <br />
                <strong>{t('topBar.helpSystem.hotkeysLabel')}</strong>
                    <ul className="list-disc pl-5 space-y-2 text-sm mt-2">
                      <li><strong>Ctrl + Alt + I:</strong> StoryInit</li>
                      <li><strong>Ctrl + Alt + T:</strong> StoryTitle</li>
                      <li><strong>Ctrl + Alt + D:</strong> StoryData</li>
                      <li><strong>Ctrl + Alt + C:</strong> StoryCaption</li>
                    </ul>
               </div>
            )}
            className={helpButtonClass}
            aria-label={t('topBar.helpLabels.systemMenu')}
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
              <button onClick={() => handleSpecialNode('StoryCaption')} className="p-2 text-left text-xs font-bold uppercase hover:bg-gray-100 dark:hover:bg-gray-700" title="StoryCaption (Ctrl + Alt + C)">
                StoryCaption
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-4">

        <div className="flex items-center gap-1">
          <button 
            onClick={openAiModal}
            className="px-4 py-2 border-2 border-gray-800 dark:border-gray-200 bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100 font-black text-xs uppercase tracking-widest hover:bg-purple-300 dark:hover:bg-purple-800 transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none flex items-center gap-2"
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

        <div className="flex items-center gap-1">
          <button 
            onClick={openPlayMode}
            className="px-6 py-2 border-2 border-gray-800 dark:border-gray-200 bg-yellow-400 text-gray-900 font-black text-xs uppercase tracking-widest hover:bg-yellow-300 transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none"
          >
            {t('topBar.play')}
          </button>
          <button
            type="button"
            onClick={() => openHelp(
              t('topBar.helpTitles.play'),
              t('topBar.helpSubtitles.play'),
              <p>{t('topBar.helpDescription.play')}<br/><br/><b>{t('hotkeys.play')}</b></p>
            )}
            className={helpButtonClass}
            aria-label={t('topBar.helpLabels.play')}
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
            className="p-2 border-2 border-gray-800 bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-200 transition-colors shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none"
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
            className="px-3 py-2 border-2 border-gray-800 bg-white hover:bg-yellow-400 dark:bg-gray-800 dark:hover:bg-yellow-400 dark:border-gray-200 font-bold text-xs uppercase transition-all shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            🎓 {t('topBar.tutorial', 'Tutorial')}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={openSettings}
            className="p-2 border-2 border-gray-800 bg-white hover:bg-yellow-400 dark:bg-gray-800 dark:hover:bg-yellow-400 dark:border-gray-200 transition-colors shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none"
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
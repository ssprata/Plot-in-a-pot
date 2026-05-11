import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function TopBar({ addNode, openSettings, openPlayMode, openAiModal }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { isDark, toggleTheme } = useTheme();

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

  return (
    <div className="p-2 border-b-2 border-gray-300 dark:border-gray-600 flex gap-2 bg-white dark:bg-gray-800 items-center shadow-sm z-50 relative">
      <div className="flex gap-2">
        <button 
          onClick={() => addNode('choice')} 
          className="px-4 py-2 border-2 border-gray-800 dark:border-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-bold text-xs uppercase tracking-wider transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none"
        >
          + Add Cena
        </button>

        <button 
          onClick={() => addNode('javascript')} 
          className="px-4 py-2 border-2 border-gray-800 dark:border-gray-200 bg-indigo-50 dark:bg-indigo-900 hover:bg-indigo-100 dark:hover:bg-indigo-800 text-indigo-900 dark:text-indigo-100 font-bold text-xs uppercase tracking-wider transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none"
        >
          + Add Script
        </button>

        <button 
          onClick={() => addNode('css')} 
          className="px-4 py-2 border-2 border-gray-800 dark:border-gray-200 bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800 text-green-900 dark:text-green-100 font-bold text-xs uppercase tracking-wider transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none"
        >
          + Add Estilo
        </button>

        {/* Menu Dropdown de Nos Especiais */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="px-4 py-2 border-2 border-gray-800 dark:border-gray-200 bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 dark:hover:bg-purple-800 text-purple-900 dark:text-purple-100 font-bold text-xs uppercase tracking-wider transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none flex items-center gap-2"
          >
            + Sistema
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 border-2 border-gray-800 dark:border-gray-200 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] flex flex-col z-50">
              <button onClick={() => handleSpecialNode('StoryInit')} className="p-2 text-left text-xs font-bold uppercase hover:bg-gray-100 dark:hover:bg-gray-700 border-b-2 border-gray-800 dark:border-gray-200">
                StoryInit
              </button>
              <button onClick={() => handleSpecialNode('StoryTitle')} className="p-2 text-left text-xs font-bold uppercase hover:bg-gray-100 dark:hover:bg-gray-700 border-b-2 border-gray-800 dark:border-gray-200">
                StoryTitle
              </button>
              <button onClick={() => handleSpecialNode('StoryData')} className="p-2 text-left text-xs font-bold uppercase hover:bg-gray-100 dark:hover:bg-gray-700 border-b-2 border-gray-800 dark:border-gray-200">
                StoryData
              </button>
              <button onClick={() => handleSpecialNode('StoryCaption')} className="p-2 text-left text-xs font-bold uppercase hover:bg-gray-100 dark:hover:bg-gray-700">
                StoryCaption
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-4">

        <button 
          onClick={openAiModal}
          className="px-4 py-2 border-2 border-gray-800 dark:border-gray-200 bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100 font-black text-xs uppercase tracking-widest hover:bg-purple-300 dark:hover:bg-purple-800 transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none flex items-center gap-2"
        >
          ✨ Gerar com IA
        </button>
      
        <button 
          onClick={openPlayMode}
          className="px-6 py-2 border-2 border-gray-800 dark:border-gray-200 bg-yellow-400 text-gray-900 font-black text-xs uppercase tracking-widest hover:bg-yellow-300 transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none"
        >
          ▶ Jogar
        </button>

        <div className="hidden md:block font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 select-none">
          Duplo clique para editar
        </div>

        <button 
          onClick={toggleTheme}
          className="p-2 border-2 border-gray-800 bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-200 transition-colors shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
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
          onClick={openSettings}
          className="p-2 border-2 border-gray-800 bg-white hover:bg-yellow-400 dark:bg-gray-800 dark:hover:bg-yellow-400 dark:border-gray-200 transition-colors shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none"
          title="Definicoes de Interface"
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
      </div>
    </div>
  );
}
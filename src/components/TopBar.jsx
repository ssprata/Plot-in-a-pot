import React from 'react';

export default function TopBar({ addNode, openSettings }) {
  return (
    <div className="p-2 border-b-2 border-gray-300 flex gap-2 bg-white items-center shadow-sm z-10">
      {/* Grupo de botões de criação */}
      <div className="flex gap-2">
        <button 
          onClick={() => addNode('choice')} 
          className="px-4 py-2 border-2 border-gray-800 bg-gray-100 hover:bg-gray-200 font-bold text-xs uppercase tracking-wider transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] active:shadow-none"
        >
          + Add Cena
        </button>

        <button 
          onClick={() => addNode('javascript')} 
          className="px-4 py-2 border-2 border-gray-800 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-xs uppercase tracking-wider transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] active:shadow-none"
        >
          + Add Script
        </button>

        <button 
          onClick={() => addNode('css')} 
          className="px-4 py-2 border-2 border-gray-800 bg-green-50 hover:bg-green-100 text-green-900 font-bold text-xs uppercase tracking-wider transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] active:shadow-none"
        >
          + Add Estilo
        </button>
      </div>

      <div className="ml-auto flex items-center gap-4">
        {/* Instrução discreta */}
        <div className="hidden md:block font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 select-none">
          Duplo clique para editar
        </div>

        {/* Botão de Definições (Popup) */}
        <button 
          onClick={openSettings}
          className="p-2 border-2 border-gray-800 bg-white hover:bg-yellow-400 transition-colors shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none"
          title="Definições de Interface"
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
              d=" orbit 10.325 10.325 0 00-2.323-2.323l-.726-.726c-.453-.453-1.246-.362-1.575.204a3.5 3.5 0 01-5.07 0c-.329-.566-1.122-.657-1.575-.204l-.726.726a10.325 10.325 0 00-2.323 2.323l-.726.726c-.453.453-.362 1.246.204 1.575a3.5 3.5 0 010 5.07c-.566.329-.657 1.122-.204 1.575l.726.726a10.325 10.325 0 002.323 2.323l.726.726c.453.453 1.246.362 1.575-.204a3.5 3.5 0 015.07 0c.329.566 1.122.657 1.575.204l.726-.726a10.325 10.325 0 002.323-2.323l.726-.726c.453-.453.362-1.246-.204-1.575a3.5 3.5 0 010-5.07c.566-.329.657-1.122.204-1.575l-.726-.726z" 
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
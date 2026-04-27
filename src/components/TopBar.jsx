import React from 'react';

export default function TopBar({ addNode }) {
  return (
    <div className="p-2 border-b-2 border-gray-300 flex gap-2 bg-white items-center shadow-sm z-10">
      {/* Botão para Cenas Narrativas */}
      <button 
        onClick={() => addNode('choice')} 
        className="px-4 py-2 border-2 border-gray-800 bg-gray-100 hover:bg-gray-200 font-bold text-xs uppercase tracking-wider transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] active:shadow-none"
      >
        + Add Cena
      </button>

      {/* Botão para Scripts (Lógica) */}
      <button 
        onClick={() => addNode('javascript')} 
        className="px-4 py-2 border-2 border-gray-800 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-xs uppercase tracking-wider transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] active:shadow-none"
      >
        + Add Script
      </button>

      {/* Botão para CSS (Estilo) */}
      <button 
        onClick={() => addNode('css')} 
        className="px-4 py-2 border-2 border-gray-800 bg-green-50 hover:bg-green-100 text-green-900 font-bold text-xs uppercase tracking-wider transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] active:shadow-none"
      >
        + Add Estilo
      </button>

      {/* Instrução de Utilização */}
      <div className="ml-auto font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 select-none">
        Dê Duplo Clique num nó para editar
      </div>
    </div>
  );
}
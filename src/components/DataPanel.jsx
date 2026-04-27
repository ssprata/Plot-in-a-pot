import React, { useState } from 'react';

export default function DataPanel({
  exportToTwine, importText, setImportText, handleImport, importError, adjacencyList, showAdjacencyList
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div
      className={`relative transition-all duration-300 ease-in-out border-l border-gray-200 bg-gray-50 flex flex-col h-full shadow-inner ${isExpanded ? 'w-[360px]' : 'w-12'
        }`}
    >
      {/* Botão de Expulsão/Recolha */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -left-3 top-4 z-20 bg-white border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors cursor-pointer"
        title={isExpanded ? "Recolher Painel" : "Expandir Painel"}
      >
        {isExpanded ? '→' : '←'}
      </button>

      {/* Conteúdo condicional para evitar overflow visual quando encolhido */}
      <div className={`flex flex-col h-full p-4 transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
        <h3 className="mt-0 border-b border-gray-300 pb-2 mb-4 text-lg font-bold text-gray-800 uppercase tracking-tight whitespace-nowrap">
          Motor de Dados
        </h3>

        <button
          onClick={exportToTwine}
          className="w-full p-3 border-2 border-gray-900 bg-indigo-600 hover:bg-indigo-700 text-white font-bold mb-6 transition-colors rounded shadow-md active:translate-y-0.5 active:shadow-sm whitespace-nowrap"
        >
          Exportar para .twee
        </button>

        <div className="mb-6 border-2 border-gray-300 bg-white p-4 rounded shadow-sm">
          <div className="font-bold mb-2 text-sm text-gray-700">Importar Ficheiro Twee</div>
          <textarea
            rows={6}
            className="w-full font-mono text-xs p-3 border border-gray-300 rounded focus:border-indigo-500 outline-none resize-none bg-gray-50"
            placeholder="Cola aqui..."
            value={importText}
            onChange={e => setImportText(e.target.value)}
          />
          <button
            onClick={handleImport}
            className="w-full mt-3 p-2 border-2 border-gray-800 bg-gray-100 hover:bg-gray-800 hover:text-white font-bold text-sm transition-all rounded"
          >
            Importar
          </button>
          {importError && (
            <div className="font-bold mt-3 text-red-600 text-[10px] bg-red-50 p-2 border border-red-200 rounded uppercase">
              {importError}
            </div>
          )}
        </div>
        {showAdjacencyList && (
          <div className="flex-1 min-h-0 flex flex-col">
            <h4 className="border-b border-gray-300 pb-1 mb-3 font-bold text-gray-700 text-sm uppercase tracking-wide">
              Adjacency List
            </h4>
            <div className="flex-1 font-mono text-[11px] bg-gray-900 text-green-400 p-4 rounded shadow-inner overflow-y-auto scrollbar-hide">
              {Object.keys(adjacencyList).map((id) => (
                <div key={id} className="mb-2 leading-relaxed border-b border-gray-800 pb-1 last:border-0 whitespace-nowrap">
                  <span className="text-blue-400 font-bold">$ {id}:</span>
                  <span className="text-white ml-2">
                    [{(adjacencyList[id] || []).join(', ')}]
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Indicador vertical quando recolhido */}
      {!isExpanded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="rotate-90 whitespace-nowrap text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Data Engine
          </span>
        </div>
      )}
    </div>
  );
}
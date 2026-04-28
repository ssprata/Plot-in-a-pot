import React, { useState } from 'react';

export default function DataPanel({
  exportToTwine, importText, setImportText, handleImport, importError,
  adjacencyList, showAdjacencyList, runValidation, validationErrors, runSimulationLog, showFlowErrors, showSimulationLegacy
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  // Drag-and-drop handlers for .twee file import
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file && file.name.endsWith('.twee')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImportText(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className={`relative transition-all duration-300 ease-in-out border-l border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex flex-col h-full shadow-inner ${isExpanded ? 'w-[360px]' : 'w-12'}`}>

      {/* Botão de Expansão/Recolha */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -left-3 top-4 z-20 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
      >
        {isExpanded ? '→' : '←'}
      </button>

      <div className={`flex flex-col h-full p-4 transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <h3 className="mt-0 border-b border-gray-300 dark:border-gray-600 pb-2 mb-4 text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-tight">Motor de Dados</h3>

        <button onClick={exportToTwine} className="w-full p-3 border-2 border-gray-900 dark:border-gray-200 bg-indigo-600 hover:bg-indigo-700 text-white font-bold mb-4 transition-colors rounded shadow-md">
          Exportar para .twee
        </button>

        <div className="mb-4 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-4 rounded shadow-sm">
          <div className="font-bold mb-2 text-sm text-gray-700 dark:text-gray-300 uppercase">Importar História</div>
          <textarea
            rows={4}
            className={`w-full font-mono text-xs p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-600 outline-none focus:ring-1 focus:ring-indigo-500 ${dragActive ? 'ring-2 ring-indigo-400 border-indigo-400' : ''}`}
            value={importText}
            onChange={e => setImportText(e.target.value)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            placeholder="Cole ou arraste um arquivo .twee aqui"
          />
          <button onClick={handleImport} className="w-full mt-2 p-2 border-2 border-gray-800 dark:border-gray-200 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 font-bold text-xs uppercase transition-all">
            Importar
          </button>
        </div>

        {/* BOTÃO DO ALGORITMO */}
        <button
          onClick={runValidation}
          className="w-full p-3 border-2 border-gray-900 dark:border-gray-200 text-gray-900 dark:!font-black bg-yellow-400 hover:bg-yellow-500 font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] active:translate-y-0.5 active:shadow-none mb-6"
        >
          Validar Lógica
        </button>

        {/* EXIBIÇÃO DE ERROS DE FLUXO */}
        {showFlowErrors && validationErrors && validationErrors.length > 0 && (
          <div className="mb-6 p-3 bg-red-900 text-red-100 rounded border-2 border-red-500 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] overflow-y-auto">
            <h4 className="font-bold text-[10px] uppercase mb-2 underline tracking-tighter">Erros de Fluxo Detetados:</h4>
            <ul className="text-[9px] space-y-4 uppercase font-mono leading-tight">
              {validationErrors.map((err, i) => (
                <li key={i} className="border-b border-red-800 pb-3 last:border-0">
                  {/* O Erro Principal */}
                  <div className="mb-1 text-sm">
                    Em <span className="text-yellow-400 font-bold">[{err.sourceLabel}]</span>, a escolha para <span className="text-white">[{err.targetLabel}]</span> é impossível de ativar.
                  </div>

                  {/* O Caminho e as Variáveis em formato de Log */}
                  <div className="bg-red-950 p-2 rounded border border-red-800 shadow-inner mt-2">
                    {err.pathTrace && err.pathTrace.length > 0 && (
                      <div className="mb-2">
                        <span className="font-black text-red-500 block mb-1">Caminho Seguido:</span>
                        <span className="text-gray-300">
                          {err.pathTrace.join(' → ')}
                        </span>
                      </div>
                    )}

                    {err.failedState && Object.keys(err.failedState).length > 0 && (
                      <div>
                        <span className="font-black text-red-500 block mb-1">Variáveis na Chegada:</span>
                        <span className="text-gray-300">
                          {JSON.stringify(err.failedState)
                            .replace(/["{}]/g, '') // Limpa formatação feia do JSON
                            .replace(/:/g, ': ')
                            .replace(/,/g, ' | ')}
                        </span>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {showAdjacencyList && (
          <div className="flex-1 min-h-0 flex flex-col">
            <h4 className="border-b border-gray-300 pb-1 mb-2 font-bold text-gray-700 text-xs uppercase">Adjacency List</h4>
            <div className="flex-1 font-mono text-[10px] bg-gray-900 text-green-400 p-3 rounded shadow-inner overflow-y-auto">
              {Object.keys(adjacencyList).map((id) => (
                <div key={id} className="mb-1">
                  <span className="text-blue-400">$ {id}:</span> [{(adjacencyList[id] || []).join(', ')}]
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Simulação de Jogabilidade */}
        {showSimulationLegacy && (
          <button
            onClick={runSimulationLog}
            className="w-full mt-2 p-2 border-2 border-gray-800 bg-gray-800 text-white hover:bg-black font-mono text-[10px] uppercase tracking-tighter transition-all shadow-[2px_2px_0px_#ccc] active:shadow-none mb-4"
          >
            Simular
          </button>
        )}
      </div>

      {!isExpanded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="rotate-90 whitespace-nowrap text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Data Engine</span>
        </div>
      )}
    </div>
  );
}
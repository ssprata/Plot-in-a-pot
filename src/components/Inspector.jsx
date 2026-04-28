import React from 'react';

export default function Inspector({
  selectedNode,
  nodes,
  updateSelectedNode,
  deleteNode,
  syncChoicesFromText,
  setStartNode
}) {
  return (
    <div className="w-[340px] p-3 border-r-2 border-gray-300 dark:border-gray-600 overflow-y-auto bg-white dark:bg-gray-800 flex flex-col h-full shadow-md">
      <h3 className="mt-0 border-b border-gray-300 dark:border-gray-600 pb-2 mb-4 text-lg font-bold text-gray-800 dark:text-gray-200">
        Inspector
      </h3>

      {selectedNode ? (
        <div className="flex-1 flex flex-col">
          <div className="mb-3 text-sm text-gray-500 dark:text-gray-400 italic">
            <strong>ID:</strong> {selectedNode.id}
          </div>

          <div className="mb-4">
            <label className="font-bold block mb-1 text-sm text-gray-700 dark:text-gray-300 uppercase tracking-tight">
              Label (Nome da Passagem)
            </label>
            <input
              className="w-full p-2 border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50 dark:bg-gray-700"
              value={selectedNode.data.label || ''}
              onChange={(e) => updateSelectedNode({ label: e.target.value })}
            />
          </div>

          <div className="mb-4">
            <label className="font-bold block mb-1 text-sm text-gray-700 dark:text-gray-300 uppercase tracking-tight">
              Type
            </label>
            <select
              className="w-full p-2 border border-gray-400 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none"
              value={selectedNode.data.nodeType || 'choice'}
              onChange={(e) => updateSelectedNode({ nodeType: e.target.value })}
            >
              <option value="choice">Choice (Cena)</option>
              <option value="javascript">JavaScript (Lógica)</option>
              <option value="css">CSS (Estilo)</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="font-bold block mb-1 text-sm text-gray-700 dark:text-gray-300 uppercase tracking-tight">
              Tags (Separadas por vírgula)
            </label>
            <input
              className="w-full p-2 border border-gray-400 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="ex: boss_fight, secreto, checkpoint"
              value={selectedNode.data.tags || ''}
              onChange={(e) => updateSelectedNode({ tags: e.target.value })}
            />
          </div>
          <div className="mb-4">
            <button
              onClick={() => setStartNode(selectedNode.id)}
              className="w-full p-2 border-2 border-gray-800 dark:border-gray-200 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-900 dark:text-blue-100 font-bold text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none"
            >
              Definir como Começo
            </button>
          </div>

          <div className="mb-4">
            <label className="font-bold block mb-1 text-sm text-gray-700 dark:text-gray-300 uppercase tracking-tight">
              {selectedNode.data.nodeType === 'choice' ? 'Texto Narrativo' : 'Código Fonte'}
            </label>
            <textarea
              rows={12}
              className={`w-full p-2 border border-gray-400 dark:border-gray-600 rounded outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${selectedNode.data.nodeType === 'choice' ? 'font-sans text-sm bg-white dark:bg-gray-700' : 'font-mono text-xs bg-gray-900 text-green-400'
                }`}
              value={selectedNode.data.content || ''}
              // 2. UNIFICAR OS ONCHANGE:
              onChange={(e) => {
                if (selectedNode.data.nodeType === 'choice') {
                  syncChoicesFromText(selectedNode.id, e.target.value);
                } else {
                  updateSelectedNode({ content: e.target.value });
                }
              }}
            />
            {selectedNode.data.nodeType === 'choice' && (
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 italic">
                Usa [[Link]] ou [[Texto|Link]] para criar conexões.
              </p>
            )}



          </div>


          <div className="mt-auto pt-4 border-t-2 border-gray-200 dark:border-gray-600">
            <button
              onClick={() => deleteNode(selectedNode.id)}
              className="w-full p-3 border-2 border-gray-900 bg-gray-100 hover:bg-red-600 hover:border-red-600 hover:text-white cursor-pointer font-black text-sm uppercase tracking-widest transition-all shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none dark:border-gray-200 dark:bg-gray-600 dark:hover:bg-red-500 dark:hover:border-red-500 dark:hover:text-white"
            >
              Apagar Nó
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center italic text-gray-400 text-sm text-center px-4">
          Seleciona um nó para editar.
        </div>
      )}
    </div>
  );
}
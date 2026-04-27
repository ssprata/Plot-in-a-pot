import React from 'react';

export default function Inspector({ 
  selectedNode, nodes, updateSelectedNode, 
  updateChoice, removeChoice, createEdgeFromChoice, addChoiceToSelected,
  deleteNode
}) {
  return (
    <div className="w-[340px] p-3 border-r-2 border-gray-300 overflow-y-auto bg-white flex flex-col h-full shadow-md">
      <h3 className="mt-0 border-b border-gray-300 pb-2 mb-4 text-lg font-bold text-gray-800">
        Inspector
      </h3>
      
      {selectedNode ? (
        <div className="flex-1 flex flex-col">
          <div className="mb-3 text-sm">
            <strong className="text-gray-700">ID:</strong> {selectedNode.id}
          </div>
          
          <div className="mb-4">
            <label className="font-bold block mb-1 text-sm text-gray-700 uppercase tracking-tight">
              Label (Nome da Passagem)
            </label>
            <input 
              className="w-full p-2 border border-gray-400 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" 
              value={selectedNode.data.label || ''} 
              onChange={(e) => updateSelectedNode({ label: e.target.value })} 
            />
          </div>

          <div className="mb-4">
            <label className="font-bold block mb-1 text-sm text-gray-700 uppercase tracking-tight">
              Type
            </label>
            <select 
              className="w-full p-2 border border-gray-400 rounded bg-gray-50 cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none"
              value={selectedNode.data.nodeType || 'choice'} 
              onChange={(e) => updateSelectedNode({ nodeType: e.target.value })}
            >
              <option value="choice">Choice (Cena)</option>
              <option value="javascript">JavaScript (Lógica)</option>
              <option value="css">CSS (Estilo)</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="font-bold block mb-1 text-sm text-gray-700 uppercase tracking-tight">
              {selectedNode.data.nodeType === 'choice' ? 'Texto Narrativo' : 'Código Fonte'}
            </label>
            <textarea 
              rows={10} 
              className={`w-full p-2 border border-gray-400 rounded outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                selectedNode.data.nodeType === 'choice' ? 'font-sans' : 'font-mono text-xs bg-gray-900 text-green-400'
              }`}
              value={selectedNode.data.content || ''} 
              onChange={(e) => updateSelectedNode({ content: e.target.value })} 
            />
          </div>

          {selectedNode.data.nodeType === 'choice' && (
            <div className="mb-6">
              <h4 className="border-b border-gray-300 pb-1 mb-3 font-bold text-gray-800 text-sm">
                Opções de Saída
              </h4>
              {(selectedNode.data.choices || []).map((c) => (
                <div key={c.id} className="border-2 border-dashed border-gray-300 p-3 mb-3 bg-gray-50 rounded-lg">
                  <input 
                    className="w-full p-2 border border-gray-400 mb-2 rounded text-sm focus:border-indigo-500 outline-none shadow-sm" 
                    value={c.text} 
                    onChange={(e) => updateChoice(c.id, { text: e.target.value })} 
                    placeholder="Texto da escolha..."
                  />
                  <div className="flex gap-2">
                    <select 
                      className="flex-1 p-2 border border-gray-400 rounded text-xs bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                      value={c.target || ''} 
                      onChange={(e) => updateChoice(c.id, { target: e.target.value })}
                    >
                      <option value="">-- Ligar a outro nó --</option>
                      {nodes.map((n) => (
                        <option key={n.id} value={n.id}>{n.id} — {n.data.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={() => createEdgeFromChoice(c.id, c.target)} 
                      disabled={!c.target} 
                      className={`flex-1 p-2 border-2 font-bold text-xs rounded transition-all ${
                        c.target 
                        ? 'border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white cursor-pointer' 
                        : 'border-gray-300 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      Criar Seta
                    </button>
                    <button 
                      onClick={() => removeChoice(c.id)} 
                      className="p-2 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded font-bold text-xs transition-all"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
              <button 
                onClick={addChoiceToSelected} 
                className="w-full p-2 border-2 border-dashed border-gray-400 text-gray-600 hover:border-indigo-500 hover:text-indigo-600 font-bold text-sm rounded transition-colors"
              >
                + Adicionar Escolha
              </button>
            </div>
          )}

          {/* Botão de Apagar Nó no fundo do Inspector */}
          <div className="mt-auto pt-4 border-t-2 border-gray-200">
            <button 
              onClick={() => deleteNode(selectedNode.id)} 
              className="w-full p-3 border-2 border-gray-900 bg-gray-100 hover:bg-red-600 hover:border-red-600 hover:text-white cursor-pointer font-black text-sm uppercase tracking-widest transition-all shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Apagar Nó Permanentemente
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center italic text-gray-400 text-sm text-center px-4">
          Seleciona um nó (duplo clique) para editar as suas propriedades.
        </div>
      )}
    </div>
  );
}
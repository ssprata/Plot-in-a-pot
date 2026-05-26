import React, { useState } from 'react';

export default function VariablesModal({ isOpen, onClose, variables, setVariables, mode = 'create' }) {
  const [newVar, setNewVar] = useState('');
  const [newValue, setNewValue] = useState('');

  if (!isOpen) return null;

  const isChangeMode = mode === 'change';

  const handleAddVariable = () => {
    if (!newVar.trim()) return;
    setVariables(prev => ({ ...prev, [newVar.trim()]: newValue }));
    setNewVar('');
    setNewValue('');
  };

  const handleValueChange = (key, value) => {
    setVariables(prev => ({ ...prev, [key]: value }));
  };

  const handleDelete = (key) => {
    setVariables(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const title = isChangeMode ? 'Alterar Variável' : 'Variáveis do Jogo';
  const hasVars = Object.keys(variables).length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 border-4 border-gray-900 dark:border-gray-200 p-6 w-[32rem] shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-gray-900 dark:border-gray-200 pb-2 mb-4">
          <div>
            <h2 className="font-black uppercase tracking-widest text-lg text-gray-900 dark:text-gray-100">{title}</h2>
            {isChangeMode && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Edita o valor que será atribuído neste nó
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="font-black text-lg px-2 py-1 border-2 border-gray-900 dark:border-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            X
          </button>
        </div>

        {/* Table */}
        <div className="mb-4">
          {hasVars ? (
            <table className="w-full text-sm border border-gray-700 dark:border-gray-300 mb-4">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="p-2 border-b border-gray-700 dark:border-gray-300 text-left">Nome</th>
                  <th className="p-2 border-b border-gray-700 dark:border-gray-300 text-left">
                    {isChangeMode ? 'Novo Valor' : 'Valor'}
                  </th>
                  {!isChangeMode && (
                    <th className="p-2 border-b border-gray-700 dark:border-gray-300" />
                  )}
                </tr>
              </thead>
              <tbody>
                {Object.entries(variables).map(([key, value]) => (
                  <tr key={key}>
                    <td className="p-2 border-b border-gray-700 dark:border-gray-300 font-mono text-gray-800 dark:text-gray-200">
                      ${key}
                    </td>
                    <td className="p-2 border-b border-gray-700 dark:border-gray-300">
                      <input
                        className="w-full px-2 py-1 border border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 rounded font-mono text-sm"
                        value={value}
                        onChange={e => handleValueChange(key, e.target.value)}
                      />
                    </td>
                    {!isChangeMode && (
                      <td className="p-2 border-b border-gray-700 dark:border-gray-300 text-right">
                        <button
                          onClick={() => handleDelete(key)}
                          className="px-2 py-1 border-2 border-red-600 text-red-600 font-black rounded hover:bg-red-600 hover:text-white transition-all"
                        >
                          Apagar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-6 text-sm text-gray-400 dark:text-gray-500 italic border border-dashed border-gray-300 dark:border-gray-600 mb-4">
              {isChangeMode
                ? 'Nenhuma variável global encontrada. Cria variáveis no nó StoryInit.'
                : 'Nenhuma variável definida ainda.'}
            </div>
          )}

          {/* Add row — only in create mode */}
          {!isChangeMode && (
            <div className="flex gap-2 mt-2">
              <input
                className="flex-1 px-2 py-1 border border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 rounded font-mono text-sm"
                placeholder="Nome da variável"
                value={newVar}
                onChange={e => setNewVar(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddVariable()}
              />
              <input
                className="flex-1 px-2 py-1 border border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 rounded font-mono text-sm"
                placeholder="Valor inicial"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddVariable()}
              />
              <button
                onClick={handleAddVariable}
                className="px-4 py-1 border-2 border-blue-600 text-blue-600 font-black rounded hover:bg-blue-600 hover:text-white transition-all"
              >
                Adicionar
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t-2 border-gray-200 dark:border-gray-600">
          <button
            onClick={onClose}
            className="px-4 py-2 font-black text-xs uppercase border-2 border-gray-900 dark:border-gray-200 bg-black text-white hover:bg-gray-800 shadow-[2px_2px_0px_#888]"
          >
            {isChangeMode ? 'Aplicar' : 'Fechar'}
          </button>
        </div>
      </div>
    </div>
  );
}

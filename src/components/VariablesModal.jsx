import React, { useState } from 'react';
import DeleteConfirmModal from './DeleteConfirmModal';

// Infers the type of a variable from its raw string value
function inferType(value) {
  const v = String(value).trim().toLowerCase();
  if (v === 'true' || v === 'false') return 'boolean';
  if (v !== '' && !isNaN(Number(v))) return 'number';
  return 'string';
}

// Returns a human-readable label + color for the type badge
function typeLabel(type) {
  switch (type) {
    case 'boolean': return { label: 'bool', color: 'text-purple-600 dark:text-purple-400 border-purple-400' };
    case 'number':  return { label: 'num',  color: 'text-blue-600 dark:text-blue-400 border-blue-400' };
    default:        return { label: 'str',  color: 'text-green-600 dark:text-green-400 border-green-400' };
  }
}

// Typed input for each variable in change mode
function TypedValueInput({ varValue, onChange }) {
  const type = inferType(varValue);

  if (type === 'boolean') {
    const isTrue = String(varValue).trim().toLowerCase() === 'true';
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange('true')}
          className={`px-3 py-1 border-2 font-black text-xs uppercase rounded transition-all ${
            isTrue
              ? 'bg-green-600 border-green-700 text-white'
              : 'bg-white dark:bg-gray-900 border-gray-400 text-gray-500 hover:border-green-500'
          }`}
        >
          true
        </button>
        <button
          onClick={() => onChange('false')}
          className={`px-3 py-1 border-2 font-black text-xs uppercase rounded transition-all ${
            !isTrue
              ? 'bg-red-600 border-red-700 text-white'
              : 'bg-white dark:bg-gray-900 border-gray-400 text-gray-500 hover:border-red-500'
          }`}
        >
          false
        </button>
      </div>
    );
  }

  if (type === 'number') {
    return (
      <input
        type="number"
        className="w-full px-2 py-1 border border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 rounded font-mono text-sm text-gray-900 dark:text-gray-100"
        value={varValue}
        onChange={e => onChange(e.target.value)}
      />
    );
  }

  // string
  return (
    <input
      type="text"
      className="w-full px-2 py-1 border border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 rounded font-mono text-sm text-gray-900 dark:text-gray-100"
      value={varValue}
      onChange={e => onChange(e.target.value)}
    />
  );
}

export default function VariablesModal({ isOpen, onClose, variables, setVariables, mode = 'create' }) {
  const [newVar, setNewVar] = useState('');
  const [newValue, setNewValue] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null); // key to delete | null

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
    setPendingDelete(key);
  };

  const confirmDelete = () => {
    setVariables(prev => {
      const copy = { ...prev };
      delete copy[pendingDelete];
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
                O tipo de cada variável é inferido automaticamente e validado
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
                  {isChangeMode && (
                    <th className="p-2 border-b border-gray-700 dark:border-gray-300 text-left w-14">Tipo</th>
                  )}
                  <th className="p-2 border-b border-gray-700 dark:border-gray-300 text-left">
                    {isChangeMode ? 'Novo Valor' : 'Valor'}
                  </th>
                  {!isChangeMode && (
                    <th className="p-2 border-b border-gray-700 dark:border-gray-300" />
                  )}
                </tr>
              </thead>
              <tbody>
                {Object.entries(variables).map(([key, value]) => {
                  const type = inferType(value);
                  const { label, color } = typeLabel(type);
                  return (
                    <tr key={key}>
                      <td className="p-2 border-b border-gray-700 dark:border-gray-300 font-mono text-gray-800 dark:text-gray-200">
                        ${key}
                      </td>

                      {/* Type badge — only in change mode */}
                      {isChangeMode && (
                        <td className="p-2 border-b border-gray-700 dark:border-gray-300">
                          <span className={`px-1.5 py-0.5 border font-black text-[10px] uppercase rounded font-mono ${color}`}>
                            {label}
                          </span>
                        </td>
                      )}

                      <td className="p-2 border-b border-gray-700 dark:border-gray-300">
                        {isChangeMode ? (
                          <TypedValueInput
                            varValue={value}
                            onChange={v => handleValueChange(key, v)}
                          />
                        ) : (
                          <input
                            className="w-full px-2 py-1 border border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 rounded font-mono text-sm text-gray-900 dark:text-gray-100"
                            value={value}
                            onChange={e => handleValueChange(key, e.target.value)}
                          />
                        )}
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
                  );
                })}
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

      <DeleteConfirmModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        message={`Tens a certeza que queres apagar a variável "$${pendingDelete}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}

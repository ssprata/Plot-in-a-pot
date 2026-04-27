import React from 'react';
import { Handle, Position } from 'reactflow';

export default function StoryNode({ data }) {
  // Processamento de Tags
  const tagsString = String(data.tags || ""); // Garante que é sempre uma string, mesmo que vazia
  const tags = tagsString
    ? tagsString.split(',').map(t => t.trim().toLowerCase()).filter(t => t !== "")
    : [];

  const isSecret = tags.includes('secreto');
  const isScript = data.nodeType === 'javascript';
  const isCss = data.nodeType === 'css';

  // Definição de Cores Dinâmicas
  let borderColor = 'border-gray-800 dark:border-gray-200';
  let headerBg = 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200';

  if (isSecret) {
    borderColor = 'border-purple-600 dark:border-purple-400';
    headerBg = 'bg-purple-900 text-purple-100 dark:bg-purple-800 dark:text-purple-200';
  } else if (isScript) {
    headerBg = 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100';
  } else if (isCss) {
    headerBg = 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100';
  }

  return (
    <div className={`border-2 ${borderColor} rounded bg-white dark:bg-gray-800 min-w-[180px] shadow-[4px_4px_0px_rgba(0,0,0,0.15)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.15)] overflow-hidden transition-all hover:shadow-[6px_6px_0px_rgba(0,0,0,0.2)] dark:hover:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] ${isSecret ? 'opacity-90' : ''}`}>

      {/* Ponto de Entrada (Target) no topo */}
      <Handle
        type="target"
        position={Position.Top}
        className={`!w-3 !h-3 border-2 border-white ${isSecret ? '!bg-purple-600' : '!bg-gray-800'}`}
      />

      {/* Cabeçalho do Nó */}
      <div className={`p-2 border-b-2 ${borderColor} font-bold text-[10px] uppercase tracking-wider text-center flex items-center justify-center gap-1 ${headerBg}`}>
        {isSecret && <span>🔒</span>}
        {data.label}
      </div>

      {/* Badges de Tags (Excluindo a tag 'secreto' da lista visual) */}
      {tags.filter(t => t !== 'secreto').length > 0 && (
        <div className="flex flex-wrap gap-1 p-1.5 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          {tags.filter(t => t !== 'secreto').map(tag => (
            <span key={tag} className="px-1.5 py-0.5 rounded-sm bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-[8px] font-black uppercase tracking-tighter border border-gray-300 dark:border-gray-500">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Lista de Escolhas (Handles de Saída) */}
      {data.choices && data.choices.length > 0 ? (
        <div className="flex flex-col">
          {data.choices.map((choice, index) => (
            <div
              key={choice.id}
              className={`relative p-2 pr-7 text-[11px] font-medium text-right bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-gray-100 ${index === data.choices.length - 1 ? '' : 'border-b border-gray-100 dark:border-gray-600'
                }`}
            >
              <span className="truncate block">{choice.text || '(Sem texto)'}</span>

              <Handle
                type="source"
                position={Position.Right}
                id={choice.id}
                className={`!w-2.5 !h-2.5 !-right-1.5 border border-white dark:border-gray-800 hover:!scale-125 transition-transform ${isSecret ? '!bg-purple-500' : '!bg-black dark:!bg-white'}`}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Saída genérica para nós de código ou sem escolhas */
        <div className="p-3 text-[10px] text-gray-400 dark:text-gray-500 text-center italic bg-gray-50 dark:bg-gray-700 flex flex-col items-center gap-1 font-mono">
          <span>{isScript ? '{ Script }' : isCss ? '{ Style }' : 'End'}</span>
          <Handle
            type="source"
            position={Position.Bottom}
            className={`!w-3 !h-3 border-2 border-white dark:border-gray-800 ${isSecret ? '!bg-purple-600' : '!bg-gray-800 dark:!bg-gray-200'}`}
          />
        </div>
      )}
    </div>
  );
}
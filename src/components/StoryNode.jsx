import React from 'react';
import { Handle, Position } from 'reactflow';

const getImageUrl = (bgImage) => {
  if (!bgImage) return '';
  if (bgImage.startsWith('data:') || bgImage.startsWith('http://') || bgImage.startsWith('https://')) {
    return bgImage;
  }
  const publicUrl = process.env.PUBLIC_URL || '';
  return `${publicUrl}/presets/${bgImage}`;
};

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
  let headerBg = '';

  if (isSecret) {
    borderColor = 'border-purple-600 dark:border-purple-400';
    headerBg = data.bgImage
      ? 'bg-purple-900/60 text-purple-100 dark:bg-purple-800/60 dark:text-purple-200'
      : 'bg-purple-900 text-purple-100 dark:bg-purple-800 dark:text-purple-200';
  } else if (isScript) {
    headerBg = data.bgImage
      ? 'bg-indigo-100/60 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-100'
      : 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100';
  } else if (isCss) {
    headerBg = data.bgImage
      ? 'bg-green-100/60 text-green-900 dark:bg-green-900/60 dark:text-green-100'
      : 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100';
  } else {
    headerBg = data.bgImage
      ? 'bg-gray-200/60 text-gray-800 dark:bg-gray-700/60 dark:text-gray-200'
      : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }

  return (
    <div className={`relative border-2 ${borderColor} rounded min-w-[180px] shadow-[4px_4px_0px_rgba(0,0,0,0.15)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.15)] overflow-hidden transition-all hover:shadow-[6px_6px_0px_rgba(0,0,0,0.2)] dark:hover:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] ${isSecret ? 'opacity-90' : ''} ${data.highlight ? 'tutorial-node-flash' : ''} ${data.bgImage ? 'bg-white/75 dark:bg-gray-900/75 backdrop-blur-[1px]' : 'bg-white dark:bg-gray-800'}`}>

      {/* Blurred background image element */}
      {data.bgImage && (
        <div
          className="absolute inset-0 z-0 pointer-events-none bg-cover bg-center"
          style={{
            backgroundImage: `url(${getImageUrl(data.bgImage)})`,
            filter: `blur(${data.bgImageBlur ?? 5}px)`,
            transform: 'scale(1.15)', // prevents white borders due to CSS blur edge bleed
            opacity: 0.35
          }}
        />
      )}

      {data.warnings && data.warnings.length > 0 && (
        <div className="absolute -top-3 -right-3 z-20 bg-orange-500 border-2 border-gray-900 text-gray-900 text-[9px] font-black px-2 py-1 uppercase tracking-widest shadow-md">
          Aviso
        </div>
      )}
      
      {/* Ponto de Entrada (Target) no topo */}
      <Handle
        type="target"
        position={Position.Top}
        className={`!w-3 !h-3 border-2 border-white ${isSecret ? '!bg-purple-600' : '!bg-gray-800'} ${
          data.highlight && data.highlightHandle === 'top' ? 'tutorial-handle-flash' : ''
        }`}
        style={{ zIndex: 30 }}
      />

      {/* Cabeçalho do Nó */}
      <div className={`relative z-10 p-2 border-b-2 ${borderColor} font-bold text-[10px] uppercase tracking-wider text-center flex items-center justify-center gap-1 ${headerBg}`}>
        {isSecret && <span>🔒</span>}
        {data.label}
      </div>

      {/* Badges de Tags (Excluindo a tag 'secreto' da lista visual) */}
      {tags.filter(t => t !== 'secreto').length > 0 && (
        <div className={`relative z-10 flex flex-wrap gap-1 p-1.5 border-b border-gray-200 dark:border-gray-600 ${data.bgImage ? 'bg-gray-50/40 dark:bg-gray-700/40' : 'bg-gray-50 dark:bg-gray-700'}`}>
          {tags.filter(t => t !== 'secreto').map(tag => (
            <span key={tag} className="px-1.5 py-0.5 rounded-sm bg-gray-200/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 text-[8px] font-black uppercase tracking-tighter border border-gray-300 dark:border-gray-500">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Lista de Escolhas (Handles de Saída) */}
      {data.choices && data.choices.length > 0 && (
        <div className="flex flex-col border-b border-gray-100 dark:border-gray-600">
          {data.choices.map((choice, index) => (
            <div
              key={choice.id}
              className={`relative z-10 p-2 pr-7 text-[11px] font-medium text-right hover:bg-gray-50/60 dark:hover:bg-gray-700/60 transition-colors text-gray-900 dark:text-gray-100 ${index === data.choices.length - 1 ? '' : 'border-b border-gray-100 dark:border-gray-600'} ${
                data.bgImage ? 'bg-white/40 dark:bg-gray-800/40' : 'bg-white dark:bg-gray-800'
              }`}
            >
              <span className="truncate block">{choice.text || '(Sem texto)'}</span>

              <Handle
                type="source"
                position={Position.Right}
                id={choice.id}
                className={`!w-2.5 !h-2.5 !-right-1.5 border border-white dark:border-gray-800 hover:!scale-125 transition-transform ${isSecret ? '!bg-purple-500' : '!bg-black dark:!bg-white'} ${
                  data.highlight && data.highlightHandle === choice.id ? 'tutorial-handle-flash' : ''
                }`}
                style={{ zIndex: 30 }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Saída inferior para arrastar novas conexões ou nós de código */}
      {(!data.choices || data.choices.length === 0 || (!isScript && !isCss)) && (
        <div className={`p-2.5 text-[9px] text-gray-400 dark:text-gray-500 text-center italic flex flex-col items-center gap-1 font-mono relative z-10 ${data.bgImage ? 'bg-gray-50/40 dark:bg-gray-700/40' : 'bg-gray-50 dark:bg-gray-700'}`}>
          {!isScript && !isCss ? (
            <span className="text-[8px] uppercase tracking-wider text-gray-400 dark:text-gray-400 select-none">Nova Escolha</span>
          ) : (
            <span>{isScript ? '{ Script }' : '{ Style }'}</span>
          )}
          <Handle
            type="source"
            position={Position.Bottom}
            className={`!w-3 !h-3 border-2 border-white dark:border-gray-800 ${isSecret ? '!bg-purple-600' : '!bg-gray-800 dark:!bg-gray-200'} ${
              data.highlight && data.highlightHandle === 'bottom' ? 'tutorial-handle-flash' : ''
            }`}
            style={{ zIndex: 30 }}
          />
        </div>
      )}
    </div>
  );
}
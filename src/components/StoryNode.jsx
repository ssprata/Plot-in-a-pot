import React from 'react';
import { Handle, Position } from 'reactflow';

export default function StoryNode({ data }) {
  // Estados lógicos para definir o estilo visual
  const isScript = data.nodeType === 'javascript';
  const isCss = data.nodeType === 'css';
  
  // Classes dinâmicas para o cabeçalho baseadas no tipo de nó
  const headerBg = isScript ? 'bg-indigo-100 text-indigo-900' : isCss ? 'bg-green-100 text-green-900' : 'bg-gray-200 text-gray-800';

  return (
    <div className="border-2 border-gray-800 rounded bg-white min-w-[180px] shadow-[4px_4px_0px_rgba(0,0,0,0.15)] overflow-hidden transition-shadow hover:shadow-[6px_6px_0px_rgba(0,0,0,0.2)]">
      
      {/* Ponto de Entrada (Target) no topo */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!bg-gray-800 !w-3 !h-3 border-2 border-white" 
      />

      {/* Cabeçalho do Nó */}
      <div className={`p-2 border-b-2 border-gray-800 font-bold text-xs uppercase tracking-wider text-center ${headerBg}`}>
        {data.label}
      </div>

      {/* Lista de Escolhas (Handles de Saída) */}
      {data.choices && data.choices.length > 0 ? (
        <div className="flex flex-col">
          {data.choices.map((choice, index) => (
            <div 
              key={choice.id} 
              className={`relative p-2 pr-7 text-[11px] font-medium text-right bg-white hover:bg-gray-50 transition-colors ${
                index === data.choices.length - 1 ? '' : 'border-b border-gray-100'
              }`}
            >
              <span className="truncate block">{choice.text || '(Sem texto)'}</span>
              
              {/* Ponto de Saída ESPECÍFICO para esta escolha */}
              <Handle
                type="source"
                position={Position.Right}
                id={choice.id}
                className="!bg-black !w-2.5 !h-2.5 !-right-1.5 border border-white hover:!scale-125 transition-transform"
              />
            </div>
          ))}
        </div>
      ) : (
        /* Saída genérica para nós de código ou sem escolhas */
        <div className="p-3 text-[10px] text-gray-400 text-center italic bg-gray-50 flex flex-col items-center gap-1">
          <span>{isScript ? '{ Código Javascript }' : isCss ? '{ Folha de Estilo }' : 'Fim de Linha'}</span>
          <Handle 
            type="source" 
            position={Position.Bottom} 
            className="!bg-gray-800 !w-3 !h-3 border-2 border-white" 
          />
        </div>
      )}
    </div>
  );
}
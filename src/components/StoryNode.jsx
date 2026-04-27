// src/components/StoryNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';

export default function StoryNode({ data }) {
  // Cores dinâmicas baseadas no tipo de nó
  const isScript = data.nodeType === 'javascript';
  const isCss = data.nodeType === 'css';
  const headerBg = isScript ? '#eef' : isCss ? '#efe' : '#eee';

  return (
    <div style={{ 
      border: '2px solid #333', 
      borderRadius: '4px', 
      background: '#fff', 
      minWidth: '180px',
      boxShadow: '4px 4px 0px rgba(0,0,0,0.1)'
    }}>
      {/* Ponto de Entrada (Target) no topo */}
      <Handle type="target" position={Position.Top} style={{ background: '#333', width: 10, height: 10 }} />

      {/* Cabeçalho do Nó */}
      <div style={{ padding: '8px', borderBottom: '2px solid #333', background: headerBg, fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}>
        {data.label}
      </div>

      {/* Lista de Escolhas (Handles de Saída) */}
      {data.choices && data.choices.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {data.choices.map((choice, index) => (
            <div key={choice.id} style={{ 
              position: 'relative', 
              padding: '6px 24px 6px 8px', 
              fontSize: '12px', 
              borderBottom: index === data.choices.length - 1 ? 'none' : '1px solid #ddd',
              textAlign: 'right',
              background: '#fafafa'
            }}>
              {choice.text || '(Sem texto)'}
              
              {/* Ponto de Saída ESPECÍFICO para esta escolha */}
              <Handle
                type="source"
                position={Position.Right}
                id={choice.id} // O ID da escolha é o ID do Handle!
                style={{ background: '#000', width: 10, height: 10, right: -6 }}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Se não tiver escolhas, tem uma saída genérica no fundo (útil para código/css) */
        <div style={{ padding: '8px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
          {isScript ? '{ Código JS }' : isCss ? '{ Estilos CSS }' : 'Sem saídas'}
          <Handle type="source" position={Position.Bottom} style={{ background: '#333', width: 10, height: 10 }} />
        </div>
      )}
    </div>
  );
}
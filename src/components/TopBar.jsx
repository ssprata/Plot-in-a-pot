import React from 'react';

export default function TopBar({ addNode }) {
  return (
    <div style={{ padding: 8, borderBottom: '2px solid #ccc', display: 'flex', gap: 8, backgroundColor: '#fff' }}>
      <button onClick={() => addNode('choice')} style={{ padding: '6px 12px', border: '1px solid #333', background: '#eee', cursor: 'pointer', fontWeight: 'bold' }}>
        Add Choice Node
      </button>
      <button onClick={() => addNode('javascript')} style={{ padding: '6px 12px', border: '1px solid #333', background: '#eef', cursor: 'pointer' }}>
        Add JavaScript
      </button>
      <button onClick={() => addNode('css')} style={{ padding: '6px 12px', border: '1px solid #333', background: '#efe', cursor: 'pointer' }}>
        Add CSS
      </button>
      <div style={{ marginLeft: 'auto', fontWeight: 'bold', alignSelf: 'center' }}>
        Clica duas vezes num nó para o selecionar
      </div>
    </div>
  );
}
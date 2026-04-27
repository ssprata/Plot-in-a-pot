import React from 'react';

export default function DataPanel({ 
  exportToTwine, importText, setImportText, handleImport, importError, adjacencyList 
}) {
  return (
    <div style={{ width: 360, padding: 12, overflowY: 'auto', backgroundColor: '#fff' }}>
      <h3 style={{ marginTop: 0, borderBottom: '1px solid #ccc', paddingBottom: 4 }}>Motor de Dados</h3>
      
      <button onClick={exportToTwine} style={{ width: '100%', padding: 8, border: '2px solid #333', background: '#eee', fontWeight: 'bold', cursor: 'pointer', marginBottom: 16 }}>Exportar para .twee</button>
      
      <div style={{ marginBottom: 16, border: '2px solid #ccc', padding: 8 }}>
        <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Importar Ficheiro Twee</div>
        <textarea rows={6} style={{ width: '100%', fontFamily: 'monospace', fontSize: 13, padding: 4, border: '1px solid #666', boxSizing: 'border-box' }} placeholder={'Cola aqui o código do ficheiro...'} value={importText} onChange={e => setImportText(e.target.value)} />
        <button onClick={handleImport} style={{ width: '100%', padding: 6, border: '1px solid #333', background: '#eee', cursor: 'pointer', marginTop: 8, fontWeight: 'bold' }}>Processar e Renderizar Grafo</button>
        {importError && <div style={{ fontWeight: 'bold', marginTop: 8, color: 'red' }}>Erro: {importError}</div>}
      </div>

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ borderBottom: '1px solid #ccc', paddingBottom: 4 }}>Lista de Adjacência (Memória)</h4>
        <div style={{ fontFamily: 'monospace', fontSize: 13, background: '#f4f4f4', padding: 8, border: '1px solid #ccc' }}>
          {Object.keys(adjacencyList).map((id) => (
            <div key={id} style={{ marginBottom: 4 }}>
              <strong>{id}:</strong> [{(adjacencyList[id] || []).join(', ')}]
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
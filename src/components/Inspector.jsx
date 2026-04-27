import React from 'react';

export default function Inspector({ 
  selectedNode, nodes, updateSelectedNode, 
  updateChoice, removeChoice, createEdgeFromChoice, addChoiceToSelected 
}) {
  return (
    <div style={{ width: 340, padding: 12, borderRight: '2px solid #ccc', overflowY: 'auto', backgroundColor: '#fff' }}>
      <h3 style={{ marginTop: 0, borderBottom: '1px solid #ccc', paddingBottom: 4 }}>Inspector</h3>
      {selectedNode ? (
        <div>
          <div style={{ marginBottom: 12 }}><strong>ID:</strong> {selectedNode.id}</div>
          
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>Label (Nome da Passagem)</label>
            <input style={{ width: '100%', padding: 4, border: '1px solid #666', boxSizing: 'border-box' }} value={selectedNode.data.label || ''} onChange={(e) => updateSelectedNode({ label: e.target.value })} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>Type</label>
            <select value={selectedNode.data.nodeType || 'choice'} onChange={(e) => updateSelectedNode({ nodeType: e.target.value })} style={{ width: '100%', padding: 4, border: '1px solid #666', boxSizing: 'border-box' }}>
              <option value="choice">Choice (Cena)</option>
              <option value="javascript">JavaScript (Lógica)</option>
              <option value="css">CSS (Estilo)</option>
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>
              {selectedNode.data.nodeType === 'choice' ? 'Texto Narrativo' : 'Código Fonte'}
            </label>
            <textarea rows={10} style={{ width: '100%', padding: 4, border: '1px solid #666', boxSizing: 'border-box', fontFamily: selectedNode.data.nodeType === 'choice' ? 'inherit' : 'monospace' }} value={selectedNode.data.content || ''} onChange={(e) => updateSelectedNode({ content: e.target.value })} />
          </div>

          {selectedNode.data.nodeType === 'choice' && (
            <div>
              <h4 style={{ borderBottom: '1px solid #ccc', paddingBottom: 4 }}>Opções de Saída</h4>
              {(selectedNode.data.choices || []).map((c) => (
                <div key={c.id} style={{ border: '2px dashed #999', padding: 8, marginBottom: 8 }}>
                  <input style={{ width: '100%', padding: 4, border: '1px solid #666', marginBottom: 8, boxSizing: 'border-box' }} value={c.text} onChange={(e) => updateChoice(c.id, { text: e.target.value })} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select value={c.target || ''} onChange={(e) => updateChoice(c.id, { target: e.target.value })} style={{ flex: 1, padding: 4, border: '1px solid #666' }}>
                      <option value="">-- Ligar a outro nó --</option>
                      {nodes.map((n) => (
                        <option key={n.id} value={n.id}>{n.id} — {n.data.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={() => createEdgeFromChoice(c.target)} disabled={!c.target} style={{ flex: 1, padding: 4, border: '1px solid #333', background: '#eee', cursor: c.target ? 'pointer' : 'not-allowed' }}>Criar Seta</button>
                    <button onClick={() => removeChoice(c.id)} style={{ padding: 4, border: '1px solid #333', background: '#eee', cursor: 'pointer' }}>Remover</button>
                  </div>
                </div>
              ))}
              <button onClick={addChoiceToSelected} style={{ width: '100%', padding: 6, border: '1px solid #333', background: '#eee', cursor: 'pointer', fontWeight: 'bold' }}>+ Adicionar Escolha</button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontStyle: 'italic', color: '#555' }}>Seleciona um nó (duplo clique) para editar.</div>
      )}
    </div>
  );
}
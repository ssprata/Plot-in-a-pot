import React, { useCallback, useState, useMemo } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { layoutNodesAndEdges } from './dagreLayout';

const initialNodes = [
  {
    id: '1',
    position: { x: 250, y: 5 },
    data: { label: 'Start', nodeType: 'text', content: 'The beginning', choices: [] }
  },
  {
    id: '2',
    position: { x: 100, y: 100 },
    data: { label: 'Choice A', nodeType: 'choice', content: '', choices: [] }
  },
  {
    id: '3',
    position: { x: 400, y: 100 },
    data: { label: 'Choice B', nodeType: 'choice', content: '', choices: [] }
  }
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e1-3', source: '1', target: '3' }
];

// --- TWEE 3 PARSER & EXPORT ---
function escapeTweeName(name) {
  // Escape [, ], {, }, and \
  return name.replace(/([\[\]{}\\])/g, '\\$1');
}

function parseTwee3(text) {
  // Matches: :: Name [tags] {meta}\nContent
  const passageRegex = /::\s*([^\[{\n]+)\s*(\[[^\]]*\])?\s*(\{[^}]*\})?\s*\n([\s\S]*?)(?=\n::|$)/g;
  let match;
  const passages = [];
  const idMap = {};
  let nodeId = 1;
  while ((match = passageRegex.exec(text))) {
    let title = match[1].trim();
    let tags = match[2] ? match[2].replace(/[\[\]]/g, '').split(/\s+/).filter(Boolean) : [];
    let meta = match[3] ? match[3].trim() : '';
    let content = match[4].replace(/\n+$/, '');
    // Unescape special chars in title
    title = title.replace(/\\([\[\]{}\\])/g, '$1');
    const id = String(nodeId++);
    idMap[title] = id;
    passages.push({ id, title, tags, meta, content });
  }
  // Build edges
  const edges = [];
  passages.forEach((p) => {
    const linkRegex = /\[\[(?:([^\]]+?)->)?([^\]]+?)\]\]/g;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(p.content))) {
      const targetTitle = linkMatch[2].trim();
      const targetId = idMap[targetTitle];
      if (targetId) {
        edges.push({ id: `e${p.id}-${targetId}`, source: p.id, target: targetId });
      }
    }
  });
  // Layout
  let nodes = passages.map((p) => ({
    id: p.id,
    position: { x: 0, y: 0 },
    data: {
      label: p.title,
      nodeType: 'text',
      content: p.content,
      tags: p.tags,
      meta: p.meta,
      choices: []
    }
  }));
  nodes = layoutNodesAndEdges(nodes, edges, 'TB');
  return { nodes, edges };
}

function exportToTwee3(nodes, edges) {
  // Ensure unique passage names
  const labelCount = {};
  const labelMap = {};
  nodes.forEach((n) => {
    let label = n.data.label || n.id;
    label = escapeTweeName(label);
    if (labelCount[label]) {
      labelCount[label] += 1;
      label = `${label} (${labelCount[label]})`;
    } else {
      labelCount[label] = 1;
    }
    labelMap[n.id] = label;
  });
  // Outgoing edges
  const outgoing = {};
  edges.forEach((e) => {
    if (!outgoing[e.source]) outgoing[e.source] = [];
    outgoing[e.source].push(e.target);
  });
  // Build passages
  let result = '';
  nodes.forEach((n) => {
    const label = labelMap[n.id];
    const tags = n.data.tags && n.data.tags.length ? ` [${n.data.tags.join(' ')}]` : '';
    const meta = n.data.meta ? ` ${n.data.meta}` : '';
    let content = n.data.content || '';
    // Add links for outgoing edges
    if (outgoing[n.id] && outgoing[n.id].length > 0) {
      outgoing[n.id].forEach((targetId) => {
        const targetLabel = labelMap[targetId] || targetId;
        // Try to find a choice text if present
        let choiceText = '';
        if (n.data.choices && Array.isArray(n.data.choices)) {
          const found = n.data.choices.find(c => c.target === targetId);
          if (found && found.text) choiceText = found.text;
        }
        if (choiceText) {
          content += `\n\n[[${choiceText}->${targetLabel}]]`;
        } else {
          content += `\n\n[[${targetLabel}]]`;
        }
      });
    }
    result += `:: ${label}${tags}${meta}\n${content}\n\n`;
  });
  return result;
}

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [counter, setCounter] = useState(4);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  // Edge selection handler
  const onEdgeClick = useCallback((event, edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
  }, []);

  // Keyboard delete handler
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdgeId) {
        setEdges((eds) => eds.filter((ed) => ed.id !== selectedEdgeId));
        setSelectedEdgeId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEdgeId, setEdges]);

  const addNode = useCallback(
    (type) => {
      const id = String(counter);
      setCounter((c) => c + 1);
      // Find a unique label
      let baseLabel = type === 'text' ? 'Text' : 'Choice';
      let label = baseLabel;
      let labelNum = 1;
      const existingLabels = new Set(nodes.map(n => n.data.label));
      while (existingLabels.has(label)) {
        labelNum += 1;
        label = `${baseLabel} ${labelNum}`;
      }
      const newNode = {
        id,
        position: { x: 200 + (counter % 5) * 80, y: 50 + ((counter / 5) | 0) * 80 },
        data: { label, nodeType: type, content: '', choices: [] }
      };
      setNodes((nds) => nds.concat(newNode));
      setSelectedNodeId(id);
    },
    [counter, setNodes, nodes]
  );

  const updateSelectedNode = useCallback(
    (patch) => {
      if (!selectedNodeId) return;
      setNodes((nds) =>
        nds.map((n) => (n.id === selectedNodeId ? { ...n, data: { ...n.data, ...patch } } : n))
      );
    },
    [selectedNodeId, setNodes]
  );

  const addChoiceToSelected = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== selectedNodeId) return n;
        const choices = Array.isArray(n.data.choices) ? n.data.choices.slice() : [];
        choices.push({ id: `c-${Date.now()}`, text: 'New choice', target: '' });
        return { ...n, data: { ...n.data, choices } };
      })
    );
  }, [selectedNodeId, setNodes]);

  const updateChoice = useCallback((choiceId, patch) => {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== selectedNodeId) return n;
        const choices = (n.data.choices || []).map((c) => (c.id === choiceId ? { ...c, ...patch } : c));
        return { ...n, data: { ...n.data, choices } };
      })
    );
  }, [selectedNodeId, setNodes]);

  const removeChoice = useCallback((choiceId) => {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== selectedNodeId) return n;
        const choices = (n.data.choices || []).filter((c) => c.id !== choiceId);
        return { ...n, data: { ...n.data, choices } };
      })
    );
  }, [selectedNodeId, setNodes]);

  const createEdgeFromChoice = useCallback(
    (targetId) => {
      if (!selectedNodeId || !targetId) return;
      const id = `e${selectedNodeId}-${targetId}-${Date.now()}`;
      setEdges((eds) => eds.concat({ id, source: selectedNodeId, target: targetId }));
    },
    [selectedNodeId, setEdges]
  );

  const handleImport = useCallback(() => {
    try {
      const { nodes: newNodes, edges: newEdges } = parseTwee3(importText);
      setNodes(newNodes);
      setEdges(newEdges);
      // Update counter to avoid ID collision
      const maxId = newNodes.reduce((max, n) => Math.max(max, parseInt(n.id, 10) || 0), 0);
      setCounter(maxId + 1);
      setImportError('');
    } catch (e) {
      setImportError('Failed to parse story.');
    }
  }, [importText, setNodes, setEdges]);

  function exportToTwine() {
    const result = exportToTwee3(nodes, edges);
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'story-export.twee';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  const adjacencyList = useMemo(() => {
    const map = {};
    nodes.forEach((n) => (map[n.id] = []));
    edges.forEach((e) => {
      if (!map[e.source]) map[e.source] = [];
      map[e.source].push(e.target);
    });
    return map;
  }, [nodes, edges]);

  const adjacencyMatrix = useMemo(() => {
    const ids = nodes.map((n) => n.id);
    const indexOf = (id) => ids.indexOf(id);
    const n = ids.length;
    const mat = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
    edges.forEach((e) => {
      const i = indexOf(e.source);
      const j = indexOf(e.target);
      if (i >= 0 && j >= 0) mat[i][j] = 1;
    });
    return { ids, mat };
  }, [nodes, edges]);

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ flex: 1, borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 8, borderBottom: '1px solid #eee', display: 'flex', gap: 8 }}>
          <button onClick={() => addNode('text')}>Add Text Node</button>
          <button onClick={() => addNode('choice')}>Add Choice Node</button>
          <div style={{ marginLeft: 'auto', color: '#666', fontSize: 12 }}>Double-click nodes to select</div>
        </div>
        <div style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDoubleClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            fitView
            selectionOnDrag
          >
            <MiniMap />
            <Controls />
            <Background gap={16} />
          </ReactFlow>
        </div>
      </div>

      <div style={{ width: 340, padding: 12, borderRight: '1px solid #ddd', overflowY: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>Inspector</h3>
        {selectedNode ? (
          <div>
            <div style={{ marginBottom: 8 }}>
              <strong>ID:</strong> {selectedNode.id}
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Label</label>
              <input
                style={{ width: '100%' }}
                value={selectedNode.data.label || ''}
                onChange={(e) => updateSelectedNode({ label: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <label>Type</label>
              <select
                value={selectedNode.data.nodeType || 'text'}
                onChange={(e) => updateSelectedNode({ nodeType: e.target.value })}
                style={{ width: '100%' }}
              >
                <option value="text">Text</option>
                <option value="choice">Choice</option>
              </select>
            </div>

            <div style={{ marginBottom: 8 }}>
              <label>Content</label>
              <textarea
                rows={4}
                style={{ width: '100%' }}
                value={selectedNode.data.content || ''}
                onChange={(e) => updateSelectedNode({ content: e.target.value })}
              />
            </div>

            {selectedNode.data.nodeType === 'choice' && (
              <div>
                <h4>Choices</h4>
                {(selectedNode.data.choices || []).map((c) => (
                  <div key={c.id} style={{ border: '1px solid #eee', padding: 6, marginBottom: 6 }}>
                    <input
                      style={{ width: '100%' }}
                      value={c.text}
                      onChange={(e) => updateChoice(c.id, { text: e.target.value })}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <select
                        value={c.target || ''}
                        onChange={(e) => updateChoice(c.id, { target: e.target.value })}
                        style={{ flex: 1 }}
                      >
                        <option value="">-- link to node (optional) --</option>
                        {nodes.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.id} — {n.data.label}
                          </option>
                        ))}
                      </select>
                      <button onClick={() => createEdgeFromChoice(c.target)} disabled={!c.target}>
                        Create Edge
                      </button>
                      <button onClick={() => removeChoice(c.id)}>Delete</button>
                    </div>
                  </div>
                ))}
                <button onClick={addChoiceToSelected}>Add Choice</button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: '#666' }}>Select a node (double-click) or add a new one.</div>
        )}
      </div>

      <div style={{ width: 360, padding: 12, overflowY: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>Analysis / Graph Data</h3>
        {/* EXPORT BUTTON */}
        <button onClick={exportToTwine} style={{ marginBottom: 12 }}>Export Story as Twine</button>
        {/* STORY IMPORT UI */}
        <div style={{ marginBottom: 16, border: '1px solid #eee', padding: 8, borderRadius: 4 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Import Story</div>
          <textarea
            rows={6}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
            placeholder={'Paste Twine/Harlowe story here...'}
            value={importText}
            onChange={e => setImportText(e.target.value)}
          />
          <button onClick={handleImport} style={{ marginTop: 6 }}>Import & Show DAG</button>
          {importError && <div style={{ color: 'red', marginTop: 4 }}>{importError}</div>}
        </div>

        <div style={{ marginBottom: 12 }}>
          <h4>Adjacency List</h4>
          <div style={{ fontFamily: 'monospace', fontSize: 13 }}>
            {Object.keys(adjacencyList).map((id) => (
              <div key={id}>
                {id}: [{(adjacencyList[id] || []).join(', ')}]
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4>Adjacency Matrix</h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: 4 }}> </th>
                  {adjacencyMatrix.ids.map((id) => (
                    <th key={id} style={{ border: '1px solid #ddd', padding: 4 }}>{id}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {adjacencyMatrix.ids.map((rowId, i) => (
                  <tr key={rowId}>
                    <td style={{ border: '1px solid #ddd', padding: 4 }}>{rowId}</td>
                    {adjacencyMatrix.mat[i].map((val, j) => (
                      <td key={j} style={{ border: '1px solid #ddd', padding: 4, textAlign: 'center' }}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
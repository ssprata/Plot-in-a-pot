import React, { useState, useEffect, useRef } from 'react';
import { rpgTemplates } from '../utils/rpgTemplates';

const CATEGORY_NAMES = {
  npc: '👤 NPC (Personagem)',
  location: '📍 Localização',
  quest: '📜 Quest / Missão',
  item: '⚔️ Item de Loot',
  lore: '📖 Lore / História',
  session: '📅 Sessão de Jogo'
};

export default function Inspector({
  selectedNode,
  nodes,
  onUpdateNode,
  onDeleteNode,
  onSelectNode,
  onCreateNode,
  isMaximized,
  onToggleMaximize
}) {
  const [width, setWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  
  const sidebarRef = useRef(null);
  const editorRef = useRef(null);
  const lastNodeId = useRef(null);

  // Autocomplete states
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestQuery, setSuggestQuery] = useState('');
  const [suggestIndex, setSuggestIndex] = useState(0);
  const [suggestStartPos, setSuggestStartPos] = useState(null);
  const [filteredNotes, setFilteredNotes] = useState([]);

  // Load editor content on selectedNode change to avoid cursor-jumping
  useEffect(() => {
    if (selectedNode && editorRef.current) {
      if (lastNodeId.current !== selectedNode.id) {
        editorRef.current.innerHTML = selectedNode.data.content || '';
        lastNodeId.current = selectedNode.id;
      }
    }
  }, [selectedNode]);

  // Sidebar resize logic
  const startResizing = (mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);

    const startWidth = sidebarRef.current ? sidebarRef.current.offsetWidth : 380;
    const startX = mouseDownEvent.clientX;

    const doDrag = (mouseMoveEvent) => {
      const deltaX = mouseMoveEvent.clientX - startX;
      const nextWidth = Math.max(320, Math.min(900, startWidth - deltaX));
      setWidth(nextWidth);
    };

    const stopDrag = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  // Sync content back to state on input
  const handleInput = () => {
    if (!editorRef.current || !selectedNode) return;
    const html = editorRef.current.innerHTML;
    onUpdateNode(selectedNode.id, { content: html });

    // Check for inline autocomplete trigger
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const node = range.startContainer;
      const offset = range.startOffset;

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue.substring(0, offset);
        const openIdx = text.lastIndexOf('[[');
        const closeIdx = text.lastIndexOf(']]');

        if (openIdx !== -1 && openIdx > closeIdx) {
          const query = text.substring(openIdx + 2);
          if (!query.includes('\n')) {
            setSuggestQuery(query);
            setSuggestStartPos({ node, offset: openIdx });
            setShowSuggest(true);
            setSuggestIndex(0);
            return;
          }
        }
      }
    }
    setShowSuggest(false);
  };

  const insertSuggestion = (title) => {
    if (!suggestStartPos || !editorRef.current) return;
    const { node, offset } = suggestStartPos;

    if (node && node.nodeType === Node.TEXT_NODE) {
      const val = node.nodeValue;
      // Remove the "[[" trigger and current typed query
      node.nodeValue = val.substring(0, offset);

      const range = document.createRange();
      range.setStart(node, offset);
      range.collapse(true);

      // Create rich inline link element
      const el = document.createElement('span');
      el.className = 'wiki-link';
      el.setAttribute('contenteditable', 'false');
      el.setAttribute('data-target', title);
      el.innerHTML = `📄 ${title}`;

      range.insertNode(el);

      // Add a non-breaking space after the tag for typing continuation
      const space = document.createTextNode('\u00A0');
      range.setStartAfter(el);
      range.collapse(true);
      range.insertNode(space);

      // Place cursor after space
      range.setStartAfter(space);
      range.collapse(true);

      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);

      // Force HTML sync
      handleInput();
    }
    setShowSuggest(false);
  };

  const handleKeyDown = (e) => {
    if (showSuggest && filteredNotes.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestIndex(prev => (prev + 1) % filteredNotes.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestIndex(prev => (prev - 1 + filteredNotes.length) % filteredNotes.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        insertSuggestion(filteredNotes[suggestIndex].data.label);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggest(false);
      }
    }
  };

  // Apply Rich Text Formatting
  const applyCommand = (cmd, value = null) => {
    document.execCommand(cmd, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
    handleInput();
  };

  // Insert Checklist Checkbox
  const handleInsertCheckbox = () => {
    const checkboxHtml = `<input type="checkbox" style="margin-right: 5px; cursor: pointer; accent-color: var(--accent);" />&nbsp;`;
    applyCommand('insertHTML', checkboxHtml);
  };

  // Trigger [[ autocomplete programmatically
  const handleInsertLinkButton = () => {
    applyCommand('insertText', '[[');
  };

  // Event delegation to capture link clicks inside contentEditable
  const handleEditorClick = (e) => {
    const targetEl = e.target.closest('.wiki-link');
    if (targetEl) {
      e.preventDefault();
      e.stopPropagation();
      const targetName = targetEl.getAttribute('data-target');
      if (targetName) {
        const targetNode = nodes.find(n => n.data?.label?.toLowerCase() === targetName.toLowerCase());
        if (targetNode) {
          onSelectNode(targetNode.id);
        } else {
          if (window.confirm(`A nota "${targetName}" não existe. Deseja criá-la agora?`)) {
            onCreateNode('lore', targetName);
          }
        }
      }
    }
  };

  // Filter notes for suggest Query
  useEffect(() => {
    if (showSuggest && selectedNode) {
      const others = nodes.filter(n => n.id !== selectedNode.id && n.data?.label);
      const filtered = others.filter(n =>
        n.data.label.toLowerCase().includes(suggestQuery.toLowerCase())
      );
      setFilteredNotes(filtered.slice(0, 8));
      if (filtered.length === 0) {
        setShowSuggest(false);
      }
    }
  }, [suggestQuery, showSuggest, nodes, selectedNode]);

  if (!selectedNode) {
    return (
      <div
        ref={sidebarRef}
        style={{ width: `${width}px` }}
        className="border-l-2 border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col h-full items-center justify-center p-6 text-center select-none text-[var(--text-muted)] shrink-0"
      >
        <span className="text-3xl mb-2">📒</span>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Nenhuma Nota Selecionada</h3>
        <p className="text-xs max-w-[200px] mt-1 opacity-70">
          Crie uma nota no painel esquerdo ou clique num nó do grafo para começar a editar.
        </p>
      </div>
    );
  }

  const category = selectedNode.data.category || 'lore';
  const metadata = selectedNode.data.metadata || {};

  const handleMetadataChange = (field, value) => {
    const updatedMetadata = { ...metadata, [field]: value };
    onUpdateNode(selectedNode.id, { metadata: updatedMetadata });
  };

  const handleCategoryChange = (newCat) => {
    onUpdateNode(selectedNode.id, { category: newCat });
  };

  const handleLoadTemplate = () => {
    const tpl = rpgTemplates[category];
    if (tpl) {
      if (window.confirm('Substituir o conteúdo atual desta nota pelo template do RPG?')) {
        // Simple MD-to-HTML mock replacements for WYSIWYG
        const htmlTemplate = tpl
          .replace(/\n/g, '<br/>')
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/\*([^*]+)\*/g, '<em>$1</em>')
          .replace(/# ([^\n<]+)/g, '<h1>$1</h1>')
          .replace(/## ([^\n<]+)/g, '<h2>$1</h2>')
          .replace(/- \[ \]/g, '<input type="checkbox" style="margin-right: 5px; cursor: pointer; accent-color: var(--accent);" />')
          .replace(/- (.*)/g, '<ul><li>$1</li></ul>')
          .replace(/\[\[(.*?)\]\]/g, (match, title) => {
            return `<span class="wiki-link" contenteditable="false" data-target="${title}">📄 ${title}</span>`;
          });
        
        if (editorRef.current) {
          editorRef.current.innerHTML = htmlTemplate;
          onUpdateNode(selectedNode.id, { content: htmlTemplate });
        }
      }
    }
  };

  return (
    <div
      ref={sidebarRef}
      style={{ width: isMaximized ? '100%' : `${width}px` }}
      className={`relative border-l-2 border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col h-full shadow-lg shrink-0 text-[var(--text-primary)] ${
        isResizing ? '' : 'transition-[width] duration-100'
      }`}
    >
      {/* Resize Handle (Only when not maximized) */}
      {!isMaximized && (
        <div
          onMouseDown={startResizing}
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-50 hover:bg-[var(--accent)] transition-colors"
        />
      )}

      <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
        
        {/* HEADER TOOLBAR / CONTROLS */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">✏️</span>
            <span className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
              {isMaximized ? 'Editor Maximizado (Modo Foco)' : 'Editor da Nota'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Maximize Toggle Button */}
            <button
              onClick={onToggleMaximize}
              className="px-2.5 py-1 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] border border-[var(--border)] text-[10px] font-black uppercase tracking-wider rounded transition-colors text-[var(--accent)]"
              title={isMaximized ? 'Restaurar Tamanho' : 'Maximizar Nota (Foco)'}
            >
              {isMaximized ? '🗗 Restaurar' : '🗖 Maximizar'}
            </button>
            <button
              onClick={() => onDeleteNode(selectedNode.id)}
              className="px-2 py-1 border border-red-950 bg-red-950/20 hover:bg-red-900/30 text-red-400 text-[10px] font-black uppercase transition-all rounded"
              title="Apagar Nota"
            >
              Apagar
            </button>
          </div>
        </div>

        {/* TITLE FIELD */}
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider">
            Título da Nota
          </label>
          <input
            type="text"
            value={selectedNode.data.label || ''}
            onChange={(e) => onUpdateNode(selectedNode.id, { label: e.target.value })}
            className="w-full p-2.5 border-2 border-[var(--border)] bg-[var(--bg-primary)] text-white text-sm font-bold border-l-4 border-l-[var(--accent)] focus:outline-none focus:border-[var(--accent)] rounded-sm"
          />
        </div>

        {/* CATEGORY & TEMPLATE SECTION */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full p-2 border border-[var(--border)] bg-[var(--bg-primary)] text-white text-xs font-bold focus:outline-none focus:border-[var(--accent)] cursor-pointer rounded-sm"
            >
              {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1 flex flex-col justify-end">
            <button
              type="button"
              onClick={handleLoadTemplate}
              className="w-full p-2 border border-[var(--border)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--accent)] hover:text-white text-[10px] font-black uppercase tracking-wider rounded transition-colors"
            >
              Carga Template 📋
            </button>
          </div>
        </div>

        {/* RPG METADATA FIELDS PANEL */}
        <div className="border border-[var(--border)] bg-[var(--bg-primary)]/40 p-3 rounded space-y-2">
          <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider block border-b border-[var(--border)] pb-1 mb-2">
            Atributos RPG (Frontmatter)
          </span>

          {category === 'npc' && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <span>Raça</span>
                <input
                  type="text"
                  value={metadata.race || ''}
                  onChange={(e) => handleMetadataChange('race', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none"
                  placeholder="ex: Elfo"
                />
              </div>
              <div className="space-y-1">
                <span>Classe</span>
                <input
                  type="text"
                  value={metadata.class || ''}
                  onChange={(e) => handleMetadataChange('class', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none"
                  placeholder="ex: Mago"
                />
              </div>
              <div className="space-y-1">
                <span>HP (Vida)</span>
                <input
                  type="text"
                  value={metadata.hp || ''}
                  onChange={(e) => handleMetadataChange('hp', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none"
                  placeholder="ex: 45"
                />
              </div>
              <div className="space-y-1">
                <span>AC (Defesa)</span>
                <input
                  type="text"
                  value={metadata.ac || ''}
                  onChange={(e) => handleMetadataChange('ac', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none"
                  placeholder="ex: 15"
                />
              </div>
              <div className="space-y-1">
                <span>Estado</span>
                <select
                  value={metadata.status || 'Vivo'}
                  onChange={(e) => handleMetadataChange('status', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none cursor-pointer"
                >
                  <option value="Vivo">🟢 Vivo</option>
                  <option value="Morto">🔴 Morto</option>
                  <option value="Desaparecido">🟡 Desaparecido</option>
                </select>
              </div>
              <div className="space-y-1">
                <span>Alinhamento</span>
                <input
                  type="text"
                  value={metadata.alignment || ''}
                  onChange={(e) => handleMetadataChange('alignment', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none"
                  placeholder="ex: Caótico e Bom"
                />
              </div>
            </div>
          )}

          {category === 'location' && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <span>Região</span>
                <input
                  type="text"
                  value={metadata.region || ''}
                  onChange={(e) => handleMetadataChange('region', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none"
                  placeholder="ex: Reinos do Norte"
                />
              </div>
              <div className="space-y-1">
                <span>Tipo de Local</span>
                <input
                  type="text"
                  value={metadata.type || ''}
                  onChange={(e) => handleMetadataChange('type', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none"
                  placeholder="ex: Taverna"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <span>Danger Level (Nível de Perigo)</span>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={metadata.danger || 0}
                  onChange={(e) => handleMetadataChange('danger', parseInt(e.target.value))}
                  className="w-full cursor-pointer accent-[var(--accent)]"
                />
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono">
                  <span>0 - Seguro</span>
                  <span>Perigo: {'💀'.repeat(metadata.danger || 0) || 'Nenhum'}</span>
                  <span>5 - Mortal</span>
                </div>
              </div>
            </div>
          )}

          {category === 'quest' && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <span>Status da Quest</span>
                <select
                  value={metadata.status || 'Não Iniciada'}
                  onChange={(e) => handleMetadataChange('status', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none cursor-pointer"
                >
                  <option value="Não Iniciada">⚪ Não Iniciada</option>
                  <option value="Em Progresso">🔵 Em Progresso</option>
                  <option value="Concluída">🟢 Concluída</option>
                  <option value="Falhada">🔴 Falhada</option>
                </select>
              </div>
              <div className="space-y-1">
                <span>Quest Giver (Quem Dá)</span>
                <input
                  type="text"
                  value={metadata.questGiver || ''}
                  onChange={(e) => handleMetadataChange('questGiver', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none"
                  placeholder="ex: Rei Aldor"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <span>Recompensa (Gold / Loot)</span>
                <input
                  type="text"
                  value={metadata.reward || ''}
                  onChange={(e) => handleMetadataChange('reward', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none"
                  placeholder="ex: 500gp, Espada de Fogo"
                />
              </div>
            </div>
          )}

          {category === 'item' && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <span>Raridade</span>
                <select
                  value={metadata.rarity || 'Comum'}
                  onChange={(e) => handleMetadataChange('rarity', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none cursor-pointer"
                >
                  <option value="Comum">Comum</option>
                  <option value="Incomum">🟢 Incomum</option>
                  <option value="Raro">🔵 Raro</option>
                  <option value="Muito Raro">🟣 Muito Raro</option>
                  <option value="Lendário">🟠 Lendário</option>
                </select>
              </div>
              <div className="space-y-1">
                <span>Tipo</span>
                <input
                  type="text"
                  value={metadata.type || ''}
                  onChange={(e) => handleMetadataChange('type', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none"
                  placeholder="ex: Espada, Armadura"
                />
              </div>
              <div className="space-y-1">
                <span>Valor (gp)</span>
                <input
                  type="text"
                  value={metadata.value || ''}
                  onChange={(e) => handleMetadataChange('value', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none"
                  placeholder="ex: 150gp"
                />
              </div>
              <div className="flex items-center justify-center space-y-1 pt-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!metadata.attunement}
                    onChange={(e) => handleMetadataChange('attunement', e.target.checked)}
                    className="w-3.5 h-3.5 accent-[var(--accent)]"
                  />
                  <span>Requer Sintonização</span>
                </label>
              </div>
            </div>
          )}

          {category === 'session' && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <span>Data In-game</span>
                <input
                  type="text"
                  value={metadata.inGameDate || ''}
                  onChange={(e) => handleMetadataChange('inGameDate', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none"
                  placeholder="ex: 14 Altosol"
                />
              </div>
              <div className="space-y-1">
                <span>Data Real</span>
                <input
                  type="text"
                  value={metadata.realDate || ''}
                  onChange={(e) => handleMetadataChange('realDate', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none"
                  placeholder="ex: DD/MM/AAAA"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <span>Jogadores Presentes</span>
                <input
                  type="text"
                  value={metadata.players || ''}
                  onChange={(e) => handleMetadataChange('players', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none"
                  placeholder="ex: Nuno, Rita"
                />
              </div>
            </div>
          )}

          {category === 'lore' && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1 col-span-2">
                <span>Associação principal (Deus, Fação...)</span>
                <input
                  type="text"
                  value={metadata.association || ''}
                  onChange={(e) => handleMetadataChange('association', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none"
                  placeholder="ex: Ordo Realitas"
                />
              </div>
            </div>
          )}
        </div>

        {/* EDITOR TITLE & WYSIWYG TOOLBAR */}
        <div className="space-y-1.5 flex-1 flex flex-col">
          <label className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider">
            Editor WYSIWYG da Nota ⚡
          </label>

          {/* RICH TOOLBAR */}
          <div className="flex flex-wrap gap-1 p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-t-sm shrink-0">
            <button
              onClick={() => applyCommand('bold')}
              className="px-2 py-0.5 hover:bg-[var(--bg-tertiary)] text-white text-xs font-black rounded border border-[var(--border)]"
              title="Negrito"
            >
              B
            </button>
            <button
              onClick={() => applyCommand('italic')}
              className="px-2 py-0.5 hover:bg-[var(--bg-tertiary)] text-white text-xs italic rounded border border-[var(--border)]"
              title="Itálico"
            >
              I
            </button>
            <button
              onClick={() => applyCommand('underline')}
              className="px-2 py-0.5 hover:bg-[var(--bg-tertiary)] text-white text-xs underline rounded border border-[var(--border)]"
              title="Sublinhado"
            >
              U
            </button>
            <button
              onClick={() => applyCommand('strikeThrough')}
              className="px-2 py-0.5 hover:bg-[var(--bg-tertiary)] text-white text-xs line-through rounded border border-[var(--border)]"
              title="Riscado"
            >
              S
            </button>
            <div className="w-px h-4 bg-[var(--border)] self-center mx-1"></div>
            <button
              onClick={() => applyCommand('formatBlock', '<h1>')}
              className="px-1.5 py-0.5 hover:bg-[var(--bg-tertiary)] text-white text-[10px] font-bold rounded border border-[var(--border)]"
              title="Título 1"
            >
              H1
            </button>
            <button
              onClick={() => applyCommand('formatBlock', '<h2>')}
              className="px-1.5 py-0.5 hover:bg-[var(--bg-tertiary)] text-white text-[10px] font-bold rounded border border-[var(--border)]"
              title="Título 2"
            >
              H2
            </button>
            <button
              onClick={() => applyCommand('insertUnorderedList')}
              className="px-2 py-0.5 hover:bg-[var(--bg-tertiary)] text-white text-xs rounded border border-[var(--border)]"
              title="Lista de Marcadores"
            >
              • Lista
            </button>
            <button
              onClick={handleInsertCheckbox}
              className="px-1.5 py-0.5 hover:bg-[var(--bg-tertiary)] text-white text-[10px] rounded border border-[var(--border)]"
              title="Lista de Verificação"
            >
              ☑️ Check
            </button>
            <div className="w-px h-4 bg-[var(--border)] self-center mx-1"></div>
            <button
              onClick={handleInsertLinkButton}
              className="px-1.5 py-0.5 hover:bg-[var(--bg-tertiary)] text-[var(--accent)] hover:text-white text-[10px] font-black rounded border border-[var(--border)]"
              title="Inserir Wiki-link para outra nota"
            >
              📄 Link Nota
            </button>
          </div>

          {/* WYSIWYG EDITABLE CONTAINER */}
          <div className="flex-1 flex flex-col relative min-h-[220px] bg-[var(--bg-primary)] border border-t-0 border-[var(--border)] rounded-b-sm overflow-hidden">
            <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onClick={handleEditorClick}
              className="wysiwyg-editor p-3 overflow-y-auto flex-1 outline-none text-white focus:ring-1 focus:ring-[var(--accent)]/30"
              placeholder="Comece a digitar..."
            />

            {/* Autocomplete floating list */}
            {showSuggest && filteredNotes.length > 0 && (
              <div className="absolute left-1 bottom-10 right-1 border-2 border-[var(--accent)] bg-[var(--bg-secondary)] shadow-2xl z-50 rounded-sm">
                <div className="bg-[var(--bg-primary)] p-1.5 text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider border-b border-[var(--border)] flex justify-between">
                  <span>Selecionar Nota (Enter para inserir)</span>
                  <span>{filteredNotes.length} opções</span>
                </div>
                <div className="max-h-[160px] overflow-y-auto">
                  {filteredNotes.map((note, idx) => {
                    const isActive = idx === suggestIndex;
                    return (
                      <div
                        key={note.id}
                        onClick={() => insertSuggestion(note.data.label)}
                        onMouseEnter={() => setSuggestIndex(idx)}
                        className={`p-2 text-xs flex justify-between cursor-pointer border-b border-[var(--border)]/40 ${
                          isActive
                            ? 'bg-[var(--accent)] text-[var(--bg-primary)] font-bold'
                            : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                        }`}
                      >
                        <span>📄 {note.data.label}</span>
                        <span className="text-[9px] opacity-70">
                          {CATEGORY_NAMES[note.data.category || 'lore']}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TAGS INPUT */}
        <div className="space-y-1 shrink-0">
          <label className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider">
            Tags (separadas por vírgula)
          </label>
          <input
            type="text"
            value={selectedNode.data.tags || ''}
            onChange={(e) => onUpdateNode(selectedNode.id, { tags: e.target.value })}
            className="w-full p-2 border border-[var(--border)] bg-[var(--bg-primary)] text-white text-xs focus:outline-none focus:border-[var(--accent)] rounded-sm"
            placeholder="ex: boss, segredo"
          />
        </div>

      </div>
    </div>
  );
}
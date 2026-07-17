import React, { useState, useEffect, useRef } from 'react';
import { renderMarkdown } from '../utils/markdownParser';
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
  onCreateNode
}) {
  const [tab, setTab] = useState('edit'); // 'edit', 'preview'
  const [width, setWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const textareaRef = useRef(null);

  // Autocomplete states
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestQuery, setSuggestQuery] = useState('');
  const [suggestIndex, setSuggestIndex] = useState(0);
  const [suggestStartPos, setSuggestStartPos] = useState(-1);
  const [filteredNotes, setFilteredNotes] = useState([]);

  // Resize Sidebar Logic
  const startResizing = (mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);

    const startWidth = sidebarRef.current ? sidebarRef.current.offsetWidth : 380;
    const startX = mouseDownEvent.clientX;

    const doDrag = (mouseMoveEvent) => {
      const deltaX = mouseMoveEvent.clientX - startX;
      const nextWidth = Math.max(300, Math.min(800, startWidth - deltaX));
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

  const handleTextareaChange = (e) => {
    const text = e.target.value;
    const selectionEnd = e.target.selectionEnd;
    onUpdateNode(selectedNode.id, { content: text });

    // Check for "[[ " autocomplete trigger
    const textBeforeCursor = text.substring(0, selectionEnd);
    const lastOpen = textBeforeCursor.lastIndexOf('[[');
    const lastClose = textBeforeCursor.lastIndexOf(']]');

    if (lastOpen !== -1 && lastOpen > lastClose) {
      const query = textBeforeCursor.substring(lastOpen + 2);
      // Ensure no spaces or newlines inside query for autocomplete trigger
      if (!query.includes('\n')) {
        setSuggestQuery(query);
        setSuggestStartPos(lastOpen);
        setShowSuggest(true);
        setSuggestIndex(0);
        return;
      }
    }
    setShowSuggest(false);
  };

  const insertSuggestion = (noteTitle) => {
    if (!textareaRef.current || !selectedNode) return;
    const text = selectedNode.data.content || '';
    const cursor = textareaRef.current.selectionEnd;
    const before = text.substring(0, suggestStartPos);
    const after = text.substring(cursor);
    const insertText = `[[${noteTitle}]]`;
    const newText = before + insertText + after;

    onUpdateNode(selectedNode.id, { content: newText });
    setShowSuggest(false);

    // Reset cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = suggestStartPos + insertText.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 50);
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

  // Filter notes based on suggestQuery
  useEffect(() => {
    if (showSuggest && selectedNode) {
      const others = nodes.filter(n => n.id !== selectedNode.id && n.data?.label);
      const filtered = others.filter(n =>
        n.data.label.toLowerCase().includes(suggestQuery.toLowerCase())
      );
      setFilteredNotes(filtered.slice(0, 8)); // limit to 8 suggestions
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
        onUpdateNode(selectedNode.id, { content: tpl });
      }
    }
  };

  const handleCheckboxToggle = (lineIndex, isChecked) => {
    const text = selectedNode.data.content || '';
    const lines = text.split('\n');
    const line = lines[lineIndex];
    if (line) {
      // Replace - [ ] or - [x]
      const updatedLine = line.replace(/^- (\[[ xX]\])/, `- [${isChecked ? 'x' : ' '}]`);
      lines[lineIndex] = updatedLine;
      onUpdateNode(selectedNode.id, { content: lines.join('\n') });
    }
  };

  const handleWikiLinkClickInPreview = (targetName) => {
    // Look up node by label
    const targetNode = nodes.find(n => n.data?.label?.toLowerCase() === targetName.toLowerCase());
    if (targetNode) {
      onSelectNode(targetNode.id);
    } else {
      // Create a new node with this name
      if (window.confirm(`A nota "${targetName}" não existe. Deseja criá-la agora?`)) {
        onCreateNode('lore', targetName);
      }
    }
  };

  return (
    <div
      ref={sidebarRef}
      style={{ width: `${width}px` }}
      className={`relative border-l-2 border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col h-full shadow-lg shrink-0 text-[var(--text-primary)] ${
        isResizing ? '' : 'transition-[width] duration-100'
      }`}
    >
      {/* Resize Handle (Left side of sidebar) */}
      <div
        onMouseDown={startResizing}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-50 hover:bg-[var(--accent)] transition-colors"
      />

      <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
        
        {/* SIDEBAR TITLE */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">✏️</span>
            <span className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">Nota do Painel</span>
          </div>
          <div className="flex items-center gap-1.5">
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
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none focus:border-[var(--accent)]"
                  placeholder="ex: Elfo, Humano"
                />
              </div>
              <div className="space-y-1">
                <span>Classe</span>
                <input
                  type="text"
                  value={metadata.class || ''}
                  onChange={(e) => handleMetadataChange('class', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none focus:border-[var(--accent)]"
                  placeholder="ex: Mago, Guerreiro"
                />
              </div>
              <div className="space-y-1">
                <span>HP (Vida)</span>
                <input
                  type="text"
                  value={metadata.hp || ''}
                  onChange={(e) => handleMetadataChange('hp', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none focus:border-[var(--accent)]"
                  placeholder="ex: 45 ou 4d10+8"
                />
              </div>
              <div className="space-y-1">
                <span>AC (Defesa)</span>
                <input
                  type="text"
                  value={metadata.ac || ''}
                  onChange={(e) => handleMetadataChange('ac', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none focus:border-[var(--accent)]"
                  placeholder="ex: 15"
                />
              </div>
              <div className="space-y-1">
                <span>Estado</span>
                <select
                  value={metadata.status || 'Vivo'}
                  onChange={(e) => handleMetadataChange('status', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none focus:border-[var(--accent)] cursor-pointer"
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
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none focus:border-[var(--accent)]"
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
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none focus:border-[var(--accent)]"
                  placeholder="ex: Reinos do Norte"
                />
              </div>
              <div className="space-y-1">
                <span>Tipo de Local</span>
                <input
                  type="text"
                  value={metadata.type || ''}
                  onChange={(e) => handleMetadataChange('type', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none focus:border-[var(--accent)]"
                  placeholder="ex: Taverna, Masmorra"
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
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none focus:border-[var(--accent)] cursor-pointer"
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
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none focus:border-[var(--accent)]"
                  placeholder="ex: Rei Aldor"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <span>Recompensa (Gold / Loot)</span>
                <input
                  type="text"
                  value={metadata.reward || ''}
                  onChange={(e) => handleMetadataChange('reward', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none focus:border-[var(--accent)]"
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
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none focus:border-[var(--accent)] cursor-pointer"
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
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none focus:border-[var(--accent)]"
                  placeholder="ex: Espada, Armadura"
                />
              </div>
              <div className="space-y-1">
                <span>Valor (gp)</span>
                <input
                  type="text"
                  value={metadata.value || ''}
                  onChange={(e) => handleMetadataChange('value', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none focus:border-[var(--accent)]"
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
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none focus:border-[var(--accent)]"
                  placeholder="ex: 14 Altosol, 1492"
                />
              </div>
              <div className="space-y-1">
                <span>Data de Jogo Real</span>
                <input
                  type="text"
                  value={metadata.realDate || ''}
                  onChange={(e) => handleMetadataChange('realDate', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none focus:border-[var(--accent)]"
                  placeholder="ex: DD/MM/AAAA"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <span>Jogadores Presentes</span>
                <input
                  type="text"
                  value={metadata.players || ''}
                  onChange={(e) => handleMetadataChange('players', e.target.value)}
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none focus:border-[var(--accent)]"
                  placeholder="ex: Nuno, Rita, José"
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
                  className="w-full p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-white text-xs focus:outline-none focus:border-[var(--accent)]"
                  placeholder="ex: Culto da Sombra"
                />
              </div>
            </div>
          )}
        </div>

        {/* EDITOR TABS */}
        <div className="flex border border-[var(--border)] rounded overflow-hidden">
          <button
            onClick={() => setTab('edit')}
            className={`flex-1 py-1.5 text-xs uppercase font-black transition-all ${
              tab === 'edit'
                ? 'bg-[var(--accent)] text-[var(--bg-primary)] font-black'
                : 'bg-[var(--bg-primary)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            Markdown Editor ✍️
          </button>
          <button
            onClick={() => setTab('preview')}
            className={`flex-1 py-1.5 text-xs uppercase font-black transition-all ${
              tab === 'preview'
                ? 'bg-[var(--accent)] text-[var(--bg-primary)] font-black'
                : 'bg-[var(--bg-primary)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            Leitura Preview 👁️
          </button>
        </div>

        {/* EDIT / PREVIEW AREA */}
        <div className="flex-1 flex flex-col min-h-[220px] relative">
          {tab === 'edit' ? (
            <div className="flex-1 flex flex-col relative h-full">
              <textarea
                ref={textareaRef}
                value={selectedNode.data.content || ''}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="# Título&#10;&#10;Escreva em **Markdown**.&#10;Use [[Nome da Nota]] para conectar a outros arquivos de campanha."
                className="w-full flex-1 p-3 border border-[var(--border)] bg-[var(--bg-primary)] text-white text-xs font-mono rounded resize-none outline-none focus:border-[var(--accent)] h-full"
              />

              {/* Autocomplete suggestions box */}
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
          ) : (
            <div className="flex-1 p-3 border border-[var(--border)] bg-[var(--bg-primary)] rounded overflow-y-auto max-h-[380px] min-h-[220px]">
              {renderMarkdown(
                selectedNode.data.content,
                handleWikiLinkClickInPreview,
                handleCheckboxToggle
              )}
            </div>
          )}
        </div>

        {/* TAGS INPUT */}
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider">
            Tags (separadas por vírgula)
          </label>
          <input
            type="text"
            value={selectedNode.data.tags || ''}
            onChange={(e) => onUpdateNode(selectedNode.id, { tags: e.target.value })}
            className="w-full p-2 border border-[var(--border)] bg-[var(--bg-primary)] text-white text-xs focus:outline-none focus:border-[var(--accent)] rounded-sm"
            placeholder="ex: importante, boss, segredo"
          />
        </div>

      </div>
    </div>
  );
}
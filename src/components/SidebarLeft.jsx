import React, { useState } from 'react';

const CATEGORIES = [
  { id: 'npc', name: 'NPCs', color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-950/20', icon: '👤' },
  { id: 'location', name: 'Locais', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-950/20', icon: '📍' },
  { id: 'quest', name: 'Quests', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-950/20', icon: '📜' },
  { id: 'item', name: 'Itens', color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-950/20', icon: '⚔️' },
  { id: 'lore', name: 'Lore', color: 'text-pink-400', border: 'border-pink-500/30', bg: 'bg-pink-950/20', icon: '📖' },
  { id: 'session', name: 'Sessões', color: 'text-indigo-400', border: 'border-indigo-500/30', bg: 'bg-indigo-950/20', icon: '📅' }
];

export default function SidebarLeft({
  nodes,
  selectedNodeId,
  onSelectNode,
  onCreateNode,
  activeTheme,
  onThemeChange
}) {
  // Search & Navigation States
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedCats, setCollapsedCats] = useState({});
  
  // Dice Roller States
  const [modifier, setModifier] = useState(0);
  const [rollHistory, setRollHistory] = useState([]);
  const [isRolling, setIsRolling] = useState(false);
  const [lastRollResult, setLastRollResult] = useState(null);

  // Group nodes by category
  const getCategorizedNodes = () => {
    const categorized = {
      npc: [],
      location: [],
      quest: [],
      item: [],
      lore: [],
      session: []
    };

    nodes.forEach(node => {
      // Zone nodes are structural, we don't display them in vault explorer
      if (node.type === 'zone' || node.data?.nodeType === 'zone') return;
      
      const cat = node.data?.category || 'lore';
      if (categorized[cat]) {
        // Filter by search term
        const title = node.data?.label || '';
        const content = node.data?.content || '';
        if (
          title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          content.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          categorized[cat].push(node);
        }
      }
    };

    return categorized;
  };

  const categorizedNodes = getCategorizedNodes();

  const toggleCollapse = (catId) => {
    setCollapsedCats(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Roll Dice Function
  const rollDice = (sides) => {
    setIsRolling(true);
    setLastRollResult(null);
    
    // Simulate dice spin animation timing
    setTimeout(() => {
      const roll = Math.floor(Math.random() * sides) + 1;
      const modValue = Number(modifier) || 0;
      const total = roll + modValue;
      const modSign = modValue >= 0 ? `+${modValue}` : `${modValue}`;
      const entry = {
        id: Date.now(),
        die: `d${sides}`,
        base: roll,
        modifier: modValue,
        total,
        text: `d${sides} (${roll}) ${modValue !== 0 ? modSign : ''} = ${total}`
      };

      setRollHistory(prev => [entry, ...prev].slice(0, 30));
      setLastRollResult(total);
      setIsRolling(false);
    }, 350);
  };

  return (
    <div className="w-[300px] border-r-2 border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col h-full shrink-0 select-none z-10 text-[var(--text-primary)]">
      
      {/* HEADER LOGO */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-primary)]">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚒️</span>
          <div>
            <h1 className="text-sm font-black tracking-widest text-[var(--accent)] uppercase">LOREFORGE</h1>
            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">RPG Campaign Vault</span>
          </div>
        </div>
      </div>

      {/* SEARCH VAULT */}
      <div className="p-3 border-b border-[var(--border)]">
        <div className="relative">
          <input
            type="text"
            placeholder="Pesquisar notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded text-xs focus:outline-none focus:border-[var(--accent)] text-[var(--text-primary)] transition-colors"
          />
          <span className="absolute left-2.5 top-2 text-xs opacity-50">🔍</span>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-2.5 top-1.5 text-xs hover:text-[var(--accent)] opacity-60"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* VAULT EXPLORER */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <div className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider px-2 mb-1">
          Arquivos da Campanha
        </div>

        {CATEGORIES.map(cat => {
          const isCollapsed = collapsedCats[cat.id];
          const list = categorizedNodes[cat.id] || [];

          return (
            <div key={cat.id} className={`border border-[var(--border)] rounded overflow-hidden ${cat.bg}`}>
              {/* Category Header */}
              <div 
                className="flex items-center justify-between p-2 hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors"
                onClick={() => toggleCollapse(cat.id)}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <span className="text-xs">{cat.icon}</span>
                  <span className={`${cat.color}`}>{cat.name}</span>
                  <span className="text-[10px] px-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded opacity-70">
                    {list.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {/* Create Note of this category */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateNode(cat.id);
                    }}
                    className="p-1 hover:bg-[var(--bg-primary)] hover:text-[var(--accent)] border border-transparent hover:border-[var(--border)] rounded transition-all text-xs"
                    title={`Criar novo ${cat.name.slice(0, -1)}`}
                  >
                    ➕
                  </button>
                  <span className="text-[9px] opacity-50 transition-transform duration-200">
                    {isCollapsed ? '▶' : '▼'}
                  </span>
                </div>
              </div>

              {/* Category Notes List */}
              {!isCollapsed && (
                <div className="border-t border-[var(--border)] bg-[var(--bg-primary)]/50 py-1 max-h-[160px] overflow-y-auto">
                  {list.length === 0 ? (
                    <div className="text-[10px] italic text-[var(--text-muted)] p-2 text-center">
                      Nenhuma nota encontrada.
                    </div>
                  ) : (
                    list.map(node => {
                      const isSelected = node.id === selectedNodeId;
                      return (
                        <div
                          key={node.id}
                          onClick={() => onSelectNode(node.id)}
                          className={`px-3 py-1.5 text-xs flex items-center justify-between cursor-pointer border-l-2 transition-all ${
                            isSelected
                              ? 'bg-[var(--bg-tertiary)] border-[var(--accent)] font-bold text-[var(--accent)]'
                              : 'border-transparent hover:bg-[var(--bg-tertiary)]/50 text-[var(--text-primary)] opacity-85 hover:opacity-100'
                          }`}
                        >
                          <span className="truncate flex-1 pr-2">{node.data?.label || '(Sem título)'}</span>
                          {node.data?.tags && (
                            <span className="text-[8px] bg-[var(--bg-tertiary)] border border-[var(--border)] px-1 rounded uppercase tracking-tighter shrink-0 opacity-60">
                              Tag
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* DICE ROLLER PANEL */}
      <div className="border-t border-[var(--border)] p-3 bg-[var(--bg-primary)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider">
            Dice Roller 🎲
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[var(--text-muted)]">Mod:</span>
            <input
              type="number"
              value={modifier}
              onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
              className="w-12 text-center py-0.5 bg-[var(--bg-tertiary)] border border-[var(--border)] text-xs text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Dice Buttons Grid */}
        <div className="grid grid-cols-4 gap-1.5 mb-2.5">
          {[4, 6, 8, 10, 12, 20, 100].map(sides => (
            <button
              key={sides}
              onClick={() => rollDice(sides)}
              disabled={isRolling}
              className={`py-1 border border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs font-black rounded transition-all active:translate-y-0.5 shadow-sm hover:border-[var(--accent)] hover:text-[var(--accent)] shrink-0 disabled:opacity-50 ${isRolling && sides === 20 ? 'dice-roll-animation' : ''}`}
            >
              d{sides}
            </button>
          ))}
          {/* Clear History Button */}
          <button
            onClick={() => setRollHistory([])}
            className="py-1 border border-red-950 bg-red-950/20 hover:bg-red-900/30 text-red-400 text-[10px] font-bold rounded transition-all shrink-0"
            title="Limpar histórico"
          >
            Clear
          </button>
        </div>

        {/* Roll Output & History */}
        <div className="bg-[var(--bg-tertiary)] border border-[var(--border)] p-2 rounded flex flex-col h-24">
          {/* Last Roll Display */}
          <div className="h-6 flex items-center justify-between border-b border-[var(--border)] pb-1 mb-1 shrink-0">
            <span className="text-[10px] font-bold text-[var(--text-muted)]">Resultado:</span>
            {isRolling ? (
              <span className="text-xs text-[var(--accent)] font-bold animate-pulse">A rolar...</span>
            ) : lastRollResult !== null ? (
              <span className="text-sm text-[var(--accent)] font-black tracking-wider animate-bounce">
                ✨ {lastRollResult}
              </span>
            ) : (
              <span className="text-[10px] italic text-[var(--text-muted)] opacity-50">-</span>
            )}
          </div>
          
          {/* Scrollable Roll Logs */}
          <div className="flex-1 overflow-y-auto text-[10px] font-mono space-y-1 text-[var(--text-muted)]">
            {rollHistory.length === 0 ? (
              <div className="text-[9px] italic text-center py-2 opacity-40">
                Nenhum dado rolado ainda.
              </div>
            ) : (
              rollHistory.map(hist => (
                <div key={hist.id} className="flex justify-between border-b border-[var(--border)]/30 pb-0.5">
                  <span className="text-gray-400 font-bold">{hist.die}</span>
                  <span className="text-white font-bold">{hist.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* THEME SELECTOR & SYSTEM FOOTER */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-between">
        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">Aparência</span>
        <select
          value={activeTheme}
          onChange={(e) => onThemeChange(e.target.value)}
          className="bg-[var(--bg-tertiary)] border border-[var(--border)] text-xs text-[var(--text-primary)] font-bold py-1 px-2 focus:outline-none focus:border-[var(--accent)] cursor-pointer text-center"
        >
          <option value="obsidian">Obsidian Dark</option>
          <option value="gothic">Gothic Crimson</option>
          <option value="emerald">Emerald Forest</option>
          <option value="cyberpunk">Cyberpunk Neon</option>
        </select>
      </div>

    </div>
  );
}

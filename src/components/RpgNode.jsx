import React from 'react';
import { Handle, Position } from 'reactflow';

const CATEGORY_META = {
  npc: { name: 'NPC', color: 'border-purple-500', headerBg: 'bg-purple-950/40 text-purple-200', icon: '👤' },
  location: { name: 'Local', color: 'border-emerald-500', headerBg: 'bg-emerald-950/40 text-emerald-200', icon: '📍' },
  quest: { name: 'Quest', color: 'border-amber-500', headerBg: 'bg-amber-950/40 text-amber-200', icon: '📜' },
  item: { name: 'Item', color: 'border-cyan-500', headerBg: 'bg-cyan-950/40 text-cyan-200', icon: '⚔️' },
  lore: { name: 'Lore', color: 'border-pink-500', headerBg: 'bg-pink-950/40 text-pink-200', icon: '📖' },
  session: { name: 'Sessão', color: 'border-indigo-500', headerBg: 'bg-indigo-950/40 text-indigo-200', icon: '📅' }
};

export default function RpgNode({ data, selected }) {
  const cat = data.category || 'lore';
  const meta = CATEGORY_META[cat] || CATEGORY_META.lore;
  
  const tagsString = String(data.tags || "");
  const tags = tagsString
    ? tagsString.split(',').map(t => t.trim().toLowerCase()).filter(t => t !== "")
    : [];

  const isSecret = tags.includes('secreto') || tags.includes('escondido');
  const metadata = data.metadata || {};

  // Color variables or Fallbacks
  const cardBorderColor = selected ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/50' : `${meta.color}`;
  
  // Custom metadata summary based on category
  const renderMetaSummary = () => {
    switch(cat) {
      case 'npc':
        return (
          <div className="space-y-1 text-[9px] font-mono text-gray-300">
            <div className="flex justify-between">
              <span>Classe:</span>
              <span className="font-bold text-white truncate max-w-[80px]">{metadata.class || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>HP / AC:</span>
              <span className="font-bold text-red-400">{metadata.hp || 'N/A'} / {metadata.ac || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Estado:</span>
              <span className={`font-bold ${metadata.status === 'Vivo' ? 'text-green-400' : metadata.status === 'Morto' ? 'text-red-500' : 'text-gray-400'}`}>
                {metadata.status || 'Desconhecido'}
              </span>
            </div>
          </div>
        );
      case 'location':
        return (
          <div className="space-y-1 text-[9px] font-mono text-gray-300">
            <div className="flex justify-between">
              <span>Tipo:</span>
              <span className="font-bold text-white truncate max-w-[80px]">{metadata.type || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Perigo:</span>
              <span className="font-bold text-red-400">{'💀'.repeat(metadata.danger || 0) || 'Nenhum'}</span>
            </div>
          </div>
        );
      case 'quest':
        return (
          <div className="space-y-1 text-[9px] font-mono text-gray-300">
            <div className="flex justify-between items-center">
              <span>Status:</span>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                metadata.status === 'Em Progresso' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                metadata.status === 'Concluída' ? 'bg-green-950 text-green-300 border border-green-800' :
                metadata.status === 'Falhada' ? 'bg-red-950 text-red-300 border border-red-800' :
                'bg-gray-950 text-gray-300 border border-gray-800'
              }`}>
                {metadata.status || 'Não Iniciada'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Recompensa:</span>
              <span className="font-bold text-amber-400 truncate max-w-[70px]">{metadata.reward || 'N/A'}</span>
            </div>
          </div>
        );
      case 'item':
        return (
          <div className="space-y-1 text-[9px] font-mono text-gray-300">
            <div className="flex justify-between">
              <span>Raridade:</span>
              <span className={`font-bold ${
                metadata.rarity === 'Lendário' ? 'text-amber-400 font-extrabold' :
                metadata.rarity === 'Muito Raro' ? 'text-purple-400' :
                metadata.rarity === 'Raro' ? 'text-blue-400' :
                metadata.rarity === 'Incomum' ? 'text-green-400' :
                'text-gray-300'
              }`}>{metadata.rarity || 'Comum'}</span>
            </div>
            <div className="flex justify-between">
              <span>Sintonização:</span>
              <span className="font-bold text-gray-400">{metadata.attunement ? 'Sim' : 'Não'}</span>
            </div>
          </div>
        );
      case 'session':
        return (
          <div className="space-y-1 text-[9px] font-mono text-gray-300">
            <div className="flex justify-between">
              <span>In-game:</span>
              <span className="font-bold text-white truncate max-w-[80px]">{metadata.inGameDate || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Data Real:</span>
              <span className="font-bold text-gray-400">{metadata.realDate || 'N/A'}</span>
            </div>
          </div>
        );
      default:
        // 'lore'
        return (
          <div className="space-y-1 text-[9px] font-mono text-gray-400 italic">
            <div className="truncate max-w-[130px]">
              {data.content ? data.content.substring(0, 45).replace(/[#*`>[\]]/g, '') + '...' : 'Sem descrição.'}
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`relative border border-t-4 ${cardBorderColor} rounded bg-[var(--bg-secondary)] shadow-lg hover:shadow-xl transition-all min-w-[160px] max-w-[185px] overflow-hidden ${isSecret ? 'opacity-70' : ''}`}>
      
      {/* Node Handle Target (Top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-[var(--accent)] border border-white hover:scale-125 transition-transform"
        style={{ zIndex: 30 }}
      />

      {/* Header containing Category, Icon and Title */}
      <div className={`p-1.5 px-2.5 flex items-center justify-between border-b border-[var(--border)] text-[9px] font-black uppercase tracking-wider ${meta.headerBg}`}>
        <div className="flex items-center gap-1">
          <span>{meta.icon}</span>
          <span>{meta.name}</span>
        </div>
        {isSecret && <span>🔒</span>}
      </div>

      {/* Body: Note Title */}
      <div className="p-2 border-b border-[var(--border)] text-xs font-bold text-white tracking-wide truncate">
        {data.label || '(Sem título)'}
      </div>

      {/* Body: Metadata details */}
      <div className="p-2 bg-[var(--bg-primary)]/40 min-h-[50px]">
        {renderMetaSummary()}
      </div>

      {/* Tags render */}
      {tags.length > 0 && (
        <div className="px-2 py-1 flex flex-wrap gap-1 border-t border-[var(--border)] bg-[var(--bg-primary)]/70">
          {tags.filter(t => t !== 'secreto' && t !== 'escondido').map(tag => (
            <span key={tag} className="text-[7px] font-black uppercase tracking-tight text-[var(--accent)] bg-[var(--bg-tertiary)] px-1 rounded border border-[var(--border)]">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Node Handle Source (Bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-[var(--accent)] border border-white hover:scale-125 transition-transform"
        style={{ zIndex: 30 }}
      />

    </div>
  );
}

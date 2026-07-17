// src/App.jsx
// Aplicação principal do LoreForge - Obsidian-like Campaign Organizer para RPG.
import React, { useCallback, useState, useMemo, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge
} from 'reactflow';
import 'reactflow/dist/style.css';

// Componentes do LoreForge
import SidebarLeft from './components/SidebarLeft';
import RpgNode from './components/RpgNode';
import Inspector from './components/Inspector';
import { rpgTemplates } from './utils/rpgTemplates';

// Mapeamento de tipos de nós para o ReactFlow
const nodeTypes = {
  npc: RpgNode,
  location: RpgNode,
  quest: RpgNode,
  item: RpgNode,
  lore: RpgNode,
  session: RpgNode,
  // Fallbacks
  choice: RpgNode,
  zone: RpgNode
};

// Dados de Exemplo para a Campanha Inicial (D&D Starter)
const initialNodes = [
  {
    id: 'node-1',
    type: 'session',
    position: { x: 200, y: 50 },
    data: {
      label: 'Sessão 1: A Chegada',
      category: 'session',
      content: `# Sessão 1 - A Chegada a Phandalin&#10;&#10;Os heróis foram contratados por [[Gundren Rockseeker]] para escoltar uma carroça até à [[Vila de Phandalin]].&#10;&#10;## Acontecimentos:&#10;- Foram atacados por goblins no caminho.&#10;- Chegaram à vila e descansaram no [[O Javali Bebado]].&#10;- Ouviram boatos de que o grupo de mercenários [[Redbrands]] está a aterrorizar os moradores locais.`,
      tags: 'sessao, starter',
      metadata: { inGameDate: '15 Mirtul, 1492', realDate: '17/07/2026', players: 'Rita, Nuno, José' }
    }
  },
  {
    id: 'node-2',
    type: 'npc',
    position: { x: 500, y: 50 },
    data: {
      label: 'Gundren Rockseeker',
      category: 'npc',
      content: `# Gundren Rockseeker&#10;&#10;Um anão negociante obstinado. Ele contratou o grupo por 10 moedas de ouro cada para fazer a escolta da carga.&#10;&#10;Ele viajou antes dos heróis com um guerreiro escolta, mas nunca chegou à [[Vila de Phandalin]]. Os heróis temem que ele tenha sido capturado.`,
      tags: 'importante, quest-giver',
      metadata: { race: 'Anão', class: 'Comerciante', hp: '32', ac: '12', status: 'Desaparecido', alignment: 'Neutro e Bom' }
    }
  },
  {
    id: 'node-3',
    type: 'location',
    position: { x: 200, y: 280 },
    data: {
      label: 'O Javali Bebado',
      category: 'location',
      content: `# O Javali Bêbado&#10;&#10;A principal taverna e hospedaria da [[Vila de Phandalin]].&#10;&#10;**Som:** Canecas batendo, gargalhadas altas, lareira crepitando.&#10;**Cheiro:** Cerveja azeda, ensopado de coelho e fumo de cachimbo.&#10;&#10;## NPCs Comuns:&#10;- [[Toblen Stonehill]] (Dono da taverna)&#10;- Rumores sobre [[Redbrands]] são discutidos aqui frequentemente.`,
      tags: 'taverna, phandalin',
      metadata: { region: 'Fronteira da Costa da Espada', type: 'Taverna', danger: 1 }
    }
  },
  {
    id: 'node-4',
    type: 'location',
    position: { x: -80, y: 280 },
    data: {
      label: 'Vila de Phandalin',
      category: 'location',
      content: `# Vila de Phandalin&#10;&#10;Uma pacata vila fronteiriça de colonos. Está construída sobre antigas ruínas de pedra.&#10;&#10;## Locais Principais:&#10;- [[O Javali Bebado]]&#10;- Câmara Municipal&#10;&#10;A vila está a sofrer pressão constante do gangue de bandidos [[Redbrands]].`,
      tags: 'cidade, segura',
      metadata: { region: 'Costa da Espada', type: 'Vila', danger: 2 }
    }
  },
  {
    id: 'node-5',
    type: 'lore',
    position: { x: -80, y: 480 },
    data: {
      label: 'Redbrands',
      category: 'lore',
      content: `# Redbrands&#10;&#10;Um bando organizado de mercenários e bandidos que usam capas vermelhas.&#10;&#10;Eles andam a exigir "dinheiro de proteção" aos comerciantes da [[Vila de Phandalin]] e raptaram alguns colonos. O seu líder é um feiticeiro misterioso conhecido como "Glasstaff".`,
      tags: 'inimigos, faccao',
      metadata: { association: 'Glasstaff / Aranha Negra' }
    }
  }
];

// Parser para extrair Wiki-links e gerar arestas automáticas
const parseEdgesFromNotes = (nodes) => {
  const newEdges = [];
  nodes.forEach(sourceNode => {
    // Skip zone nodes
    if (sourceNode.type === 'zone') return;
    
    const content = sourceNode.data?.content || '';
    const wikiLinkRegex = /\[\[(.*?)\]\]/g;
    let match;
    const targetsFound = new Set();

    while ((match = wikiLinkRegex.exec(content)) !== null) {
      const linkContent = match[1];
      let targetName = linkContent;
      // Handle [[Target|Label]] structure
      if (linkContent.includes('|')) {
        targetName = linkContent.split('|')[0].trim();
      } else {
        targetName = targetName.trim();
      }

      // Procura nó de destino pelo título (case-insensitive)
      const targetNode = nodes.find(n => n.data?.label?.toLowerCase() === targetName.toLowerCase());
      if (targetNode && targetNode.id !== sourceNode.id) {
        const edgeId = `edge-${sourceNode.id}-${targetNode.id}`;
        if (!targetsFound.has(targetNode.id)) {
          targetsFound.add(targetNode.id);
          newEdges.push({
            id: edgeId,
            source: sourceNode.id,
            target: targetNode.id,
            type: 'default',
            animated: true,
            style: { stroke: 'var(--accent)', strokeWidth: 2 }
          });
        }
      }
    }
  });
  return newEdges;
};

// Recupera dados salvos do LocalStorage ou carrega os iniciais
const getSavedData = () => {
  const saved = localStorage.getItem('loreforge-vault');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.nodes)) {
        return parsed;
      }
    } catch (e) {
      console.error("Erro ao carregar dados do LocalStorage", e);
    }
  }
  return {
    nodes: initialNodes,
    theme: 'obsidian'
  };
};

const SAVED_DATA = getSavedData();

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(SAVED_DATA.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [activeTheme, setActiveTheme] = useState(SAVED_DATA.theme || 'obsidian');

  // Auto-Save do Vault
  useEffect(() => {
    localStorage.setItem('loreforge-vault', JSON.stringify({
      nodes,
      theme: activeTheme
    }));
  }, [nodes, activeTheme]);

  // Sincroniza Tema no Body do Documento
  useEffect(() => {
    document.body.className = `theme-${activeTheme}`;
  }, [activeTheme]);

  // Sincronização Automática de Edges baseada nos Wiki-links Markdown
  useEffect(() => {
    const parsedEdges = parseEdgesFromNotes(nodes);
    
    // Compara para evitar loops infinitos de re-render
    const currentIds = edges.map(e => e.id).join(',');
    const parsedIds = parsedEdges.map(e => e.id).join(',');
    
    if (currentIds !== parsedIds) {
      setEdges(parsedEdges);
    }
  }, [nodes, edges, setEdges]);

  // Callback ao selecionar nó no Grafo ou na Barra Lateral
  const handleSelectNode = useCallback((nodeId) => {
    setSelectedNodeId(nodeId);
    // Realça nó selecionado no React Flow (opcional, ReactFlow já lida com seleção básica)
  }, []);

  const onNodeClick = useCallback((event, node) => {
    handleSelectNode(node.id);
  }, [handleSelectNode]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Atualizar dados de uma nota específica
  const handleUpdateNode = useCallback((nodeId, updatedFields) => {
    setNodes(nds => nds.map(node => {
      if (node.id === nodeId) {
        // Se mudou o label (título), atualiza o tipo para condizer com a categoria caso mude
        const category = updatedFields.category !== undefined ? updatedFields.category : node.data.category;
        return {
          ...node,
          type: category,
          data: {
            ...node.data,
            ...updatedFields,
            category
          }
        };
      }
      return node;
    }));
  }, [setNodes]);

  // Apagar nota
  const handleDeleteNode = useCallback((nodeId) => {
    if (window.confirm('Tem certeza de que deseja apagar esta nota? Esta ação é irreversível.')) {
      setNodes(nds => nds.filter(n => n.id !== nodeId));
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
    }
  }, [selectedNodeId, setNodes]);

  // Criar uma nova nota
  const handleCreateNode = useCallback((category = 'lore', defaultTitle = null) => {
    const defaultTemplate = rpgTemplates[category] || '';
    
    // Encontra um título único
    let title = defaultTitle;
    if (!title) {
      let index = 1;
      const categoryName = category.toUpperCase();
      do {
        title = `Novo ${categoryName} ${index}`;
        index++;
      } while (nodes.some(n => n.data?.label?.toLowerCase() === title.toLowerCase()));
    }

    const uniqueId = `node-${Date.now()}`;
    const newNode = {
      id: uniqueId,
      type: category,
      // Posição no centro aproximado do viewport do grafo
      position: { x: 150 + Math.random() * 150, y: 150 + Math.random() * 150 },
      data: {
        label: title,
        category,
        content: defaultTemplate.replace('[Nome do NPC]', title).replace('[Nome do Local]', title).replace('[Nome da Quest]', title).replace('[Nome do Item]', title).replace('[Título da Lore/Fação]', title),
        tags: '',
        metadata: category === 'npc' ? { status: 'Vivo' } : category === 'quest' ? { status: 'Não Iniciada' } : {}
      }
    };

    setNodes(nds => [...nds, newNode]);
    setSelectedNodeId(uniqueId);
  }, [nodes, setNodes]);

  // Conectar manualmente no grafo -> Cria Wiki-link no texto
  const onConnect = useCallback((params) => {
    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);

    if (sourceNode && targetNode) {
      const targetLabel = targetNode.data?.label || '';
      const currentContent = sourceNode.data?.content || '';
      const appendText = `\n\n[[${targetLabel}]]`;

      // Atualiza o conteúdo do nó de origem
      handleUpdateNode(sourceNode.id, { content: currentContent + appendText });
    }
  }, [nodes, handleUpdateNode]);

  // Seleciona a nota ativa
  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  return (
    <div className="flex h-screen w-screen font-sans bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden">
      
      {/* 1. PAINEL ESQUERDO: EXPLORER, DIALLER & DICE ROLLER */}
      <SidebarLeft
        nodes={nodes}
        selectedNodeId={selectedNodeId}
        onSelectNode={handleSelectNode}
        onCreateNode={handleCreateNode}
        activeTheme={activeTheme}
        onThemeChange={setActiveTheme}
      />

      {/* 2. CENTRO: GRAFO INTERACTIVO REACTFLOW */}
      <div className="flex-1 flex flex-col relative bg-[var(--bg-primary)] border-r border-[var(--border)]">
        {/* Top Mini Info Bar */}
        <div className="p-3 bg-[var(--bg-secondary)] border-b border-[var(--border)] flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded text-[var(--text-muted)] font-mono">
              Grafo das Notas
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              Dica: Arraste de um nó a outro para criar conexões (Wiki-links automáticos).
            </span>
          </div>
          <button
            onClick={() => handleCreateNode('lore')}
            className="px-2.5 py-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-primary)] font-bold text-xs rounded transition-colors"
          >
            + Nova Nota 📄
          </button>
        </div>

        {/* React Flow Editor */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode={null} // Desativa Delete do teclado para não colidir com o editor
          >
            <MiniMap
              className="!border !border-[var(--border)] !bg-[var(--bg-secondary)] transition-colors rounded shadow-lg"
              nodeColor={(n) => {
                const cat = n.data?.category || 'lore';
                if (cat === 'npc') return 'rgba(139, 92, 246, 0.4)';
                if (cat === 'location') return 'rgba(16, 185, 129, 0.4)';
                if (cat === 'quest') return 'rgba(245, 158, 11, 0.4)';
                if (cat === 'item') return 'rgba(6, 182, 212, 0.4)';
                if (cat === 'session') return 'rgba(99, 102, 241, 0.4)';
                return 'rgba(236, 72, 153, 0.4)';
              }}
              nodeStrokeColor={(n) => {
                const cat = n.data?.category || 'lore';
                if (cat === 'npc') return '#8b5cf6';
                if (cat === 'location') return '#10b981';
                if (cat === 'quest') return '#f59e0b';
                if (cat === 'item') return '#06b6d4';
                if (cat === 'session') return '#6366f1';
                return '#ec4899';
              }}
              maskColor="rgba(15, 15, 17, 0.7)"
              nodeStrokeWidth={3}
            />
            <Controls className="!border-[var(--border)] !bg-[var(--bg-tertiary)] overflow-hidden" />
            <Background gap={18} color="rgba(255, 255, 255, 0.05)" />
          </ReactFlow>
        </div>
      </div>

      {/* 3. PAINEL DIREITO: INSPETOR DE METADADOS & EDITOR MARKDOWN */}
      <Inspector
        selectedNode={selectedNode}
        nodes={nodes}
        onUpdateNode={handleUpdateNode}
        onDeleteNode={handleDeleteNode}
        onSelectNode={handleSelectNode}
        onCreateNode={handleCreateNode}
      />

    </div>
  );
}

export default App;
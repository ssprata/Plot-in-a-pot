// src/App.jsx
// Aplicação principal do LoreForge - Obsidian-like Campaign Organizer para RPG.
import React, { useCallback, useState, useMemo, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState
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

// Dados de Exemplo para a Campanha Inicial (Ordem Paranormal - Fumaça Púrpura)
const initialNodes = [
  {
    id: 'node-1',
    type: 'session',
    position: { x: 250, y: -100 },
    data: {
      label: 'Fumaça Púrpura',
      category: 'session',
      content: '<h1>Fumaça Púrpura</h1><strong>Prólogo - Ordem Paranormal RPG</strong><br/>Um idílico passeio de trem pelos vinhedos da Serra Gaúcha transforma-se num terrível pesadelo. Os personagens, inicialmente "civis" sem ligação à Ordo Realitas, encontram-se a bordo da <span class="wiki-link" contenteditable="false" data-target="Maria Fumaça de Gonçalino">📄 Maria Fumaça de Gonçalino</span>.<br/><br/><h2>Ganchos de Campanha</h2><ul><li><strong>Férias:</strong> O passeio turístico faz parte das férias dos personagens.</li><li><strong>Novas Experiências:</strong> Um escape da rotina diária no sul do país.</li><li><strong>Presente Inesperado:</strong> Um bilhete ganho num sorteio.</li></ul><h2>Investigação e Cenas</h2><ol><li><strong>Banquete Inicial:</strong> Os heróis comem os pratos servidos por <span class="wiki-link" contenteditable="false" data-target="Lia Schmidt">📄 Lia Schmidt</span>.</li><li><strong>Cena 1 - Porta Emperrada:</strong> A primeira manifestação paranormal ocorre quando a porta do vagão tranca, gerando uma <span class="wiki-link" contenteditable="false" data-target="Porta Emperrada">📄 Porta Emperrada</span>.</li><li><strong>Cena 2 - Sombras &amp; Vultos:</strong> O trem para e as luzes apagam, revelando vultos de Energia.</li><li><strong>Cena 3 - Massacre no Trem:</strong> <span class="wiki-link" contenteditable="false" data-target="Matheus Santavilla">📄 Matheus Santavilla</span> assassina <span class="wiki-link" contenteditable="false" data-target="Luiz Marzio">📄 Luiz Marzio</span>.</li></ol>',
      tags: 'missao-0, prologo, nex-0',
      metadata: { inGameDate: 'Primavera, 2023', realDate: '17/07/2026', players: 'Civis (NEX 0% -> 5%)' }
    }
  },
  {
    id: 'node-2',
    type: 'location',
    position: { x: 0, y: 50 },
    data: {
      label: 'Maria Fumaça de Gonçalino',
      category: 'location',
      content: '<h1>Maria Fumaça de Gonçalino</h1><strong>Tipo:</strong> Trem Turístico<br/><strong>Região:</strong> Gonçalino, Serra Gaúcha<br/><strong>Nível de Perigo:</strong> 💀💀<br/><br/><h2>Vagões do Trem</h2><ul><li><strong>Locomotiva:</strong> Onde fica o painel de comando para controlar os motores.</li><li><strong>Vagão-Cozinha:</strong> Onde fica a caixa de fusíveis do <span class="wiki-link" contenteditable="false" data-target="Enigma dos Fusíveis">📄 Enigma dos Fusíveis</span>.</li><li><strong>Vagão de Primeira Classe:</strong> Onde <span class="wiki-link" contenteditable="false" data-target="Luiz Marzio">📄 Luiz Marzio</span> estava disfarçado.</li><li><strong>Vagões de Passageiros Comuns:</strong> Onde os personagens e <span class="wiki-link" contenteditable="false" data-target="Lia Schmidt">📄 Lia Schmidt</span> começam.</li><li><strong>Vagão-Depósito:</strong> Onde são estocadas as malas e os fusíveis sobressalentes.</li></ul><br/>O trem é parado a meio do trajeto, sobre uma alta ponte de ferro que cruza o cânion.',
      tags: 'trem, cenario',
      metadata: { region: 'Serra Gaúcha', type: 'Trem', danger: 2 }
    }
  },
  {
    id: 'node-3',
    type: 'npc',
    position: { x: -200, y: 50 },
    data: {
      label: 'Lia Schmidt',
      category: 'npc',
      content: '<h1>Lia Schmidt</h1><strong>Descrição Física:</strong> Uma jovem ruiva, simpática e com leve sobrepeso. Usa o uniforme azul e preto da Maria Fumaça.<br/><strong>Personalidade:</strong> Solícita, mas visivelmente nervosa por ser o seu primeiro dia de trabalho. A sua família humilde vive na região de Dourado.<br/><br/><h2>Papel na Missão</h2><ul><li>Serve a degustação de vinhos, queijos e massas aos passageiros.</li><li>Pede ajuda para abrir a <span class="wiki-link" contenteditable="false" data-target="Porta Emperrada">📄 Porta Emperrada</span> quando esta tranca misteriosamente.</li><li>Após o <span class="wiki-link" contenteditable="false" data-target="Massacre no Trem">📄 Massacre no Trem</span>, fica em choque absoluto mas ajuda os sobreviventes com um kit de primeiros socorros.</li></ul>',
      tags: 'npc, inocente, tripulante',
      metadata: { race: 'Humana', class: 'Atendente', hp: '12', ac: '10', status: 'Vivo', alignment: 'Neutro e Bom' }
    }
  },
  {
    id: 'node-4',
    type: 'quest',
    position: { x: -200, y: 220 },
    data: {
      label: 'Porta Emperrada',
      category: 'quest',
      content: '<h1>Porta Emperrada</h1><strong>Dador da Quest:</strong> <span class="wiki-link" contenteditable="false" data-target="Lia Schmidt">📄 Lia Schmidt</span><br/><strong>Recompensa:</strong> Avançar na investigação<br/><br/><h2>Objetivos</h2><div style="margin-bottom: 5px;"><input type="checkbox" style="margin-right: 5px; cursor: pointer; accent-color: var(--accent);" /> Ajudar Lia a abrir a porta que liga os vagões de passageiros.</div><div style="margin-bottom: 5px;"><input type="checkbox" style="margin-right: 5px; cursor: pointer; accent-color: var(--accent);" /> Fazer testes de Atletismo ou Tecnologia (DT 15) para forçar o painel.</div><div style="margin-bottom: 5px;"><input type="checkbox" style="margin-right: 5px; cursor: pointer; accent-color: var(--accent);" /> Evitar ser atingido pelo arco voltaico (1d6 de dano de eletricidade, Ref DT 15 reduz à metade).</div><br/><em>Nota: A falha na abertura da porta é provocada pelo ritual de Energia oculto no trem.</em>',
      tags: 'quest, tutorial, perigo',
      metadata: { status: 'Em Progresso', reward: 'Acesso aos outros vagões', questGiver: 'Lia Schmidt' }
    }
  },
  {
    id: 'node-5',
    type: 'npc',
    position: { x: 250, y: 150 },
    data: {
      label: 'Luiz Marzio',
      category: 'npc',
      content: '<h1>Luiz Marzio</h1><strong>Descrição Física:</strong> Agente federal de estatura mediana, barbado, com jaqueta cinza de capuz. Infiltrado disfarçado sob o nome falso "Carlos Zanotti" (33 anos).<br/><br/><h2>Investigação Oculta</h2><ul><li>Infiltrado para investigar o desvio de verbas e lavagem de dinheiro de <span class="wiki-link" contenteditable="false" data-target="Giordano Argento">📄 Giordano Argento</span>.</li><li>Carrega a prova crucial: o <span class="wiki-link" contenteditable="false" data-target="Documento Secreto">📄 Documento Secreto</span>, que contém a lista de investidores e políticos corruptos.</li><li>É assassinado a sangue frio por <span class="wiki-link" contenteditable="false" data-target="Matheus Santavilla">📄 Matheus Santavilla</span> no vagão-cozinha durante o <span class="wiki-link" contenteditable="false" data-target="Massacre no Trem">📄 Massacre no Trem</span>.</li></ul>',
      tags: 'npc, policia-federal, investigacao',
      metadata: { race: 'Humano', class: 'Policial Federal', hp: '15', ac: '18', status: 'Morto', alignment: 'Ordeiro e Bom' }
    }
  },
  {
    id: 'node-6',
    type: 'item',
    position: { x: 450, y: 150 },
    data: {
      label: 'Documento Secreto',
      category: 'item',
      content: '<h1>Documento Secreto</h1><strong>Tipo:</strong> Lista de Nomes (Handout)<br/><strong>Raridade:</strong> Raro<br/><br/><h2>Detalhes</h2>Uma lista impressa detalhando autoridades envolvidas numa operação de lavagem de dinheiro que financia os planos ocultistas de <span class="wiki-link" contenteditable="false" data-target="Giordano Argento">📄 Giordano Argento</span> e a sua falsa siderúrgica.<br/><br/><h2>Como Obter:</h2><ul><li>Encontrado dentro da maleta trancada (senha: 1990) no corpo de <span class="wiki-link" contenteditable="false" data-target="Luiz Marzio">📄 Luiz Marzio</span> após o <span class="wiki-link" contenteditable="false" data-target="Massacre no Trem">📄 Massacre no Trem</span>.</li></ul>',
      tags: 'item, pista, principal',
      metadata: { rarity: 'Raro', type: 'Documento', attunement: false, value: 'Inestimável' }
    }
  },
  {
    id: 'node-7',
    type: 'npc',
    position: { x: 500, y: 320 },
    data: {
      label: 'Matheus Santavilla',
      category: 'npc',
      content: '<h1>Matheus Santavilla</h1><strong>Descrição Física:</strong> Jovem pardo, alto, cabelos bem cortados. Veste o uniforme de Chefe da Tripulação da Maria Fumaça, mas revela-se vestindo um manto roxo.<br/><br/><h2>O Cultista de Energia</h2><ul><li>Capanga e assecla de <span class="wiki-link" contenteditable="false" data-target="Giordano Argento">📄 Giordano Argento</span>.</li><li>Sabotou a eletricidade do trem usando um ritual para isolar a comunicação.</li><li>Executou <span class="wiki-link" contenteditable="false" data-target="Luiz Marzio">📄 Luiz Marzio</span> para recuperar o <span class="wiki-link" contenteditable="false" data-target="Documento Secreto">📄 Documento Secreto</span>.</li><li>Provoca o <span class="wiki-link" contenteditable="false" data-target="Massacre no Trem">📄 Massacre no Trem</span> ao conjurar um poderoso ritual de eletrocussão que carboniza todos os passageiros.</li><li>Confronta os personagens no <span class="wiki-link" contenteditable="false" data-target="Confronto no Expresso">📄 Confronto no Expresso</span> usando rituais de Energia e Conhecimento.</li></ul>',
      tags: 'npc, cultista, inimigo',
      metadata: { race: 'Humano (Ocultista)', class: 'Chefe de Tripulação', hp: '15 / 30', ac: '15 / 17', status: 'Vivo', alignment: 'Caótico e Mau' }
    }
  },
  {
    id: 'node-8',
    type: 'session',
    position: { x: 250, y: 320 },
    data: {
      label: 'Massacre no Trem',
      category: 'session',
      content: '<h1>Massacre no Trem</h1><strong>Acontecimentos da Investigação:</strong><ul><li>O trem para no meio da ponte sobre a Queda da Estrela e as luzes se apagam.</li><li>Os personagens ouvem gritos de <span class="wiki-link" contenteditable="false" data-target="Lia Schmidt">📄 Lia Schmidt</span> no vagão da frente.</li><li>No vagão-cozinha, encontram <span class="wiki-link" contenteditable="false" data-target="Matheus Santavilla">📄 Matheus Santavilla</span> com uma faca de churrasco sobre o corpo sem vida de <span class="wiki-link" contenteditable="false" data-target="Luiz Marzio">📄 Luiz Marzio</span>.</li><li>Matheus ativa um poderoso ritual de Energia que eletrocuta e incinera todos os civis no trem, deixando apenas os personagens e Lia vivos.</li><li>Os personagens devem revistar o corpo de Luiz para obter o <span class="wiki-link" contenteditable="false" data-target="Documento Secreto">📄 Documento Secreto</span> e a sua pistola.</li></ul>',
      tags: 'cena-3, cena-4, combate, terror',
      metadata: { inGameDate: 'Primavera, 2023', realDate: '17/07/2026', players: 'Civis (NEX 0% -> 5%)' }
    }
  },
  {
    id: 'node-9',
    type: 'quest',
    position: { x: 30, y: 320 },
    data: {
      label: 'Enigma dos Fusíveis',
      category: 'quest',
      content: '<h1>Enigma dos Fusíveis</h1><strong>Tipo:</strong> Puzzle de Engenharia<br/><strong>Objetivo:</strong> Restaurar a energia da Maria Fumaça para conduzir o trem até ao fim da ponte.<br/><br/><h2>O Quadro de Fusíveis</h2><ul><li>Localizado na parede do vagão-cozinha.</li><li>Possui 6 espaços: Vermelho, Verde, Amarelo 1, Rosa, Amarelo 2, Roxo.</li><li>Faltam os fusíveis Verde, Rosa e Roxo (o antigo roxo está queimado).</li></ul><h2>Resolução:</h2><ol><li>Ir até ao vagão-depósito restrito (requer Vermelho + Amarelo 1).</li><li>Passar pelo carrinho de metal emperrado na porta (Acrobacia DT 15 ou Atletismo DT 20).</li><li>Fazer testes de Investigação (DT 20) no depósito para achar os fusíveis Rosa e Roxo, e a senha (5926) do cofre onde está o fusível Verde.</li><li>Acoplar tudo para religar o painel!</li></ol>',
      tags: 'quest, puzzle, investigacao',
      metadata: { status: 'Não Iniciada', reward: 'Acesso à Locomotiva', questGiver: 'Painel de Eletricidade' }
    }
  },
  {
    id: 'node-10',
    type: 'session',
    position: { x: 250, y: 480 },
    data: {
      label: 'Confronto no Expresso',
      category: 'session',
      content: '<h1>Confronto no Expresso</h1><strong>O Combate Final do Prólogo</strong><br/>Após restaurarem a energia e tentarem pilotar o trem, o painel de comando explode devido à instabilidade do paranormal. Os personagens correm de volta e deparam-se com <span class="wiki-link" contenteditable="false" data-target="Matheus Santavilla">📄 Matheus Santavilla</span> em sua forma de Cultista de Energia.<br/><br/><h2>Dificuldade e Combate</h2><ul><li>Matheus usa o ritual Eletrocussão e Perturbação.</li><li><strong>Ajuda da Ordem:</strong> <span class="wiki-link" contenteditable="false" data-target="Eduarda Flom">📄 Eduarda Flom</span>, agente da Ordo Realitas, chega numa van preta e consegue infiltrar-se no trem para atuar como aliada do grupo.</li><li>Ao derrotarem Matheus, a missão termina e os sobreviventes são recrutados.</li></ul>',
      tags: 'combate-final, prologo, nex-5',
      metadata: { inGameDate: 'Primavera, 2023', realDate: '17/07/2026', players: 'Rita, Nuno, José, Eduarda' }
    }
  },
  {
    id: 'node-11',
    type: 'npc',
    position: { x: 30, y: 480 },
    data: {
      label: 'Eduarda Flom',
      category: 'npc',
      content: '<h1>Eduarda Flom</h1><strong>Descrição Física:</strong> Jovem de cabelos curtos com mechas roxas, casaco de ganga, calça rasgada, luva preta sem dedos e coldre tático com uma pistola na coxa.<br/><strong>Personalidade:</strong> Rebelde na aparência, mas extremamente gentil, protetora e madura.<br/><br/><h2>Recrutamento para a Ordem</h2><ul><li>Agente da Ordo Realitas enviada para interceptar a atividade ocultista no trem.</li><li>Chega para apoiar os heróis no <span class="wiki-link" contenteditable="false" data-target="Confronto no Expresso">📄 Confronto no Expresso</span>.</li><li>Após a batalha, recolhe as provas, trata os feridos e faz o convite oficial para os sobreviventes se juntarem à Ordo Realitas (NEX 5%).</li></ul>',
      tags: 'npc, aliado, ordo-realitas',
      metadata: { race: 'Humana', class: 'Agente da Ordem', hp: '25', ac: '15', status: 'Vivo', alignment: 'Ordeiro e Bom' }
    }
  },
  {
    id: 'node-12',
    type: 'npc',
    position: { x: 500, y: 480 },
    data: {
      label: 'Giordano Argento',
      category: 'npc',
      content: '<h1>Giordano Argento</h1><strong>Descrição:</strong> Atual patriarca do clã Argento, um empresário elegante de 63 anos, presidente do Grupo Argento S/A.<br/><strong>O Ocultista:</strong> Um mestre ocultista poderoso que busca desviar verbas públicas e privadas para financiar rituais por todo o Brasil com o propósito de enfraquecer a Membrana.<br/><br/><h2>Relações com o Prólogo</h2><ul><li>Mandou o seu capanga <span class="wiki-link" contenteditable="false" data-target="Matheus Santavilla">📄 Matheus Santavilla</span> recuperar o <span class="wiki-link" contenteditable="false" data-target="Documento Secreto">📄 Documento Secreto</span> e silenciar o agente federal <span class="wiki-link" contenteditable="false" data-target="Luiz Marzio">📄 Luiz Marzio</span>.</li><li>O seu nome é o elo que conecta todas as missões futuras da campanha.</li></ul>',
      tags: 'npc, vilao, ocultista',
      metadata: { race: 'Humano (Ocultista)', class: 'Patriarca do Clã', hp: '150 (Enfraquecido)', ac: '27', status: 'Vivo', alignment: 'Caótico e Mau' }
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
    const targets = new Set();

    // 1. Scan for WYSIWYG tags data-target="Target"
    const dataTargetRegex = /data-target="([^"]+)"/g;
    let dataMatch;
    while ((dataMatch = dataTargetRegex.exec(content)) !== null) {
      targets.add(dataMatch[1].trim());
    }

    // 2. Scan for [[Target]] or [[Target|Label]] links
    const wikiLinkRegex = /\[\[(.*?)\]\]/g;
    let mdMatch;
    while ((mdMatch = wikiLinkRegex.exec(content)) !== null) {
      const linkContent = mdMatch[1];
      let targetName = linkContent;
      if (linkContent.includes('|')) {
        targetName = linkContent.split('|')[0].trim();
      } else {
        targetName = targetName.trim();
      }
      targets.add(targetName);
    }

    // Generate edges for unique targets
    targets.forEach(targetName => {
      // Procura nó de destino pelo título (case-insensitive)
      const targetNode = nodes.find(n => n.data?.label?.toLowerCase() === targetName.toLowerCase());
      if (targetNode && targetNode.id !== sourceNode.id) {
        const edgeId = `edge-${sourceNode.id}-${targetNode.id}`;
        newEdges.push({
          id: edgeId,
          source: sourceNode.id,
          target: targetNode.id,
          type: 'default',
          animated: true,
          style: { stroke: 'var(--accent)', strokeWidth: 2 }
        });
      }
    });
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
  const [isMaximized, setIsMaximized] = useState(false);

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
      const checkTitleExists = (name) => {
        const lowerName = name.toLowerCase();
        return nodes.some(n => n.data?.label?.toLowerCase() === lowerName);
      };
      
      let candidateTitle = `Novo ${categoryName} ${index}`;
      while (checkTitleExists(candidateTitle)) {
        index++;
        candidateTitle = `Novo ${categoryName} ${index}`;
      }
      title = candidateTitle;
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
    <div className={`flex h-screen w-screen font-sans bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden ${isMaximized ? 'focus-mode-active' : ''}`}>
      
      {/* 1. PAINEL ESQUERDO: EXPLORER, DIALLER & DICE ROLLER */}
      {!isMaximized && (
        <SidebarLeft
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNode}
          onCreateNode={handleCreateNode}
          activeTheme={activeTheme}
          onThemeChange={setActiveTheme}
        />
      )}

      {/* 2. CENTRO: GRAFO INTERACTIVO REACTFLOW */}
      <div className="flex-1 flex flex-col relative bg-[var(--bg-primary)] border-r border-[var(--border)]">
        {/* Top Mini Info Bar (escondido se maximizado para foco total) */}
        {!isMaximized && (
          <div className="p-3 bg-[var(--bg-secondary)] border-b border-[var(--border)] flex justify-between items-center z-10">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded text-[var(--text-muted)] font-mono">
                Grafo das Notas
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                Dica: Arraste de um nó a outro para criar conexões (Wiki-links automáticos).
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (window.confirm("Aviso: Isto apagará todo o progresso atual e restaurará a missão padrão 'Fumaça Púrpura'. Deseja continuar?")) {
                    localStorage.removeItem('loreforge-vault');
                    window.location.reload();
                  }
                }}
                className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-400 font-bold text-xs rounded transition-colors"
              >
                Recomeçar Campanha 🔄
              </button>
              <button
                onClick={() => handleCreateNode('lore')}
                className="px-2.5 py-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-primary)] font-bold text-xs rounded transition-colors"
              >
                + Nova Nota 📄
              </button>
            </div>
          </div>
        )}

        {/* React Flow Editor */}
        <div className="flex-1 relative">
          {/* Overlay do Editor Maximizado (Modo Foco) */}
          {isMaximized && (
            <div className="absolute inset-0 z-40 bg-[var(--bg-secondary)] flex flex-col">
              <Inspector
                selectedNode={selectedNode}
                nodes={nodes}
                onUpdateNode={handleUpdateNode}
                onDeleteNode={handleDeleteNode}
                onSelectNode={handleSelectNode}
                onCreateNode={handleCreateNode}
                isMaximized={isMaximized}
                onToggleMaximize={() => setIsMaximized(false)}
              />
            </div>
          )}

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

      {/* 3. PAINEL DIREITO: INSPETOR DE METADADOS & EDITOR RICHO WYSIWYG */}
      {!isMaximized && (
        <Inspector
          selectedNode={selectedNode}
          nodes={nodes}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onSelectNode={handleSelectNode}
          onCreateNode={handleCreateNode}
          isMaximized={isMaximized}
          onToggleMaximize={() => setIsMaximized(true)}
        />
      )}
    </div>
  );
}

export default App;
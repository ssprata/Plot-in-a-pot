// src/utils/tweeParser.js
import { layoutNodesAndEdges } from '../dagreLayout';

// --- FUNÇÕES DE SEGURANÇA (Baseadas no Parser Oficial) ---

export function escapeForTweeHeader(value) {
  return value.replace(/\\/g, '\\\\').replace(/([[\]{}])/g, '\\$1');
}

export function escapeForTweeText(value) {
  // Escapa "::" no início de uma linha para não quebrar a estrutura
  return value.replace(/^::/gm, '\\::');
}

export function unescapeForTweeHeader(value) {
  return value.replace(/\\([[\]{}])/g, '$1').replace(/\\\\/g, '\\');
}

export function unescapeForTweeText(value) {
  // Reverte "\::" para "::" para leitura limpa
  return value.replace(/^\\:/gm, ':');
}

// --- IMPORTAÇÃO (Leitura do Ficheiro) ---

export function parseTwee3(source) {
  // 1. Separação segura por nós, garantindo que o :: está no início da linha
  const passageBlocks = source
    .split(/^::/m)
    .filter(s => s.trim() !== '')
    .map(s => ':: ' + s);

  const passages = [];
  const idMap = {};
  let nodeId = 1;

  // 2. Extração Segura de Cabeçalhos e Metadados
  passageBlocks.forEach(block => {
    const lines = block.split(/\r?\n/);
    const headerLine = lines[0];
    
    // Regex robusta oficial para separar Nome, Tags e JSON
    const headerBits = /^::\s*(.*?(?:\\\s)?)\s*(\[.*?\])?\s*(\{.*?\})?\s*$/.exec(headerLine);
    
    if (!headerBits) return; // Ignora blocos corrompidos
    
    const [, rawName, rawTags, rawMetadata] = headerBits;
    if (rawName.trim() === '') return;

    const title = unescapeForTweeHeader(rawName.trim());
    const content = lines.slice(1).join('\n').replace(/^\\:/gm, ':').trim();
    
    let tags = [];
    if (rawTags) {
      tags = rawTags.replace(/^\[(.*)\]$/g, '$1').split(/\s/).filter(t => t.trim() !== '').map(unescapeForTweeHeader);
    }

    // Identificar o tipo de nó pelas tags
    let nodeType = 'choice';
    if (tags.includes('script')) nodeType = 'javascript';
    if (tags.includes('stylesheet')) nodeType = 'css';

    // Ler coordenadas visuais (se existirem)
    let position = { x: 0, y: 0 };
    if (rawMetadata) {
      try {
        const metadata = JSON.parse(rawMetadata);
        if (typeof metadata.position === 'string') {
          const [left, top] = metadata.position.split(',').map(parseFloat);
          if (!isNaN(left) && !isNaN(top)) {
            position = { x: left, y: top };
          }
        }
      } catch (e) {
        console.warn(`Aviso: Falha ao ler metadados do nó ${title}`);
      }
    }

    const id = String(nodeId++);
    idMap[title] = id;
    
    passages.push({
      id,
      position,
      data: { label: title, nodeType, content, tags, choices: [] }
    });
  });

  // 3. Fase do Grafo: Extrair Ligações (Arestas)
  const edges = [];
  passages.forEach((p) => {
    const linkRegex = /\[\[(?:([^\]]+?)->)?([^\]]+?)\]\]/g;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(p.data.content))) {
      const targetTitle = linkMatch[2].trim();
      const targetId = idMap[targetTitle];
      if (targetId) {
        edges.push({ id: `e${p.id}-${targetId}`, source: p.id, target: targetId });
      }
    }
  });

  // 4. Auto-layout apenas para nós que vieram com coordenadas a zero (sem metadados)
  const needsLayout = passages.every(p => p.position.x === 0 && p.position.y === 0);
  let nodes = passages;
  if (needsLayout && edges.length > 0) {
     nodes = layoutNodesAndEdges(passages, edges, 'TB');
  }

  return { nodes, edges };
}

// --- EXPORTAÇÃO (Gravação do Ficheiro) ---

export function exportToTwee3(nodes, edges) {
  const labelCount = {};
  const labelMap = {};
  
  // Garantir nomes únicos e escapados
  nodes.forEach((n) => {
    let label = escapeForTweeHeader(n.data.label || n.id);
    if (labelCount[label]) {
      labelCount[label] += 1;
      label = `${label} (${labelCount[label]})`;
    } else {
      labelCount[label] = 1;
    }
    labelMap[n.id] = label;
  });

  const outgoing = {};
  edges.forEach((e) => {
    if (!outgoing[e.source]) outgoing[e.source] = [];
    outgoing[e.source].push(e.target);
  });

  let result = '';
  nodes.forEach((n) => {
    const label = labelMap[n.id];
    
    // Restaurar tags obrigatórias baseadas no Node Type
    let tagsArray = Array.isArray(n.data.tags) ? [...n.data.tags] : [];
    if (n.data.nodeType === 'javascript' && !tagsArray.includes('script')) tagsArray.push('script');
    if (n.data.nodeType === 'css' && !tagsArray.includes('stylesheet')) tagsArray.push('stylesheet');
    
    const tags = tagsArray.length > 0 ? ` [${tagsArray.map(escapeForTweeHeader).join(' ')}]` : '';
    
    // Gerar JSON de posição seguro
    const metadataObj = { position: `${Math.round(n.position.x)},${Math.round(n.position.y)}` };
    const metadata = ` ${JSON.stringify(metadataObj).replace(/\s+/g, '')}`;

    // Escapar duplos pontos no meio do texto
    let content = escapeForTweeText(n.data.content || '');

    // Injetar links formatados no fundo do texto
    if (outgoing[n.id] && outgoing[n.id].length > 0) {
      outgoing[n.id].forEach((targetId) => {
        const targetLabel = labelMap[targetId] || targetId;
        let choiceText = '';
        if (n.data.choices && Array.isArray(n.data.choices)) {
          const found = n.data.choices.find(c => c.target === targetId);
          if (found && found.text) choiceText = found.text;
        }
        content += choiceText ? `\n\n[[${choiceText}->${targetLabel}]]` : `\n\n[[${targetLabel}]]`;
      });
    }
    result += `:: ${label}${tags}${metadata}\n${content}\n\n`;
  });
  return result;
}
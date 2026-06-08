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
  // Array dedicado para guardar os avisos detetados durante a leitura
  const warnings = [];

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
    if (tags.includes('zone')) nodeType = 'zone';

    // Ler coordenadas visuais (se existirem)
    let position = { x: 0, y: 0 };
    let parent = null;
    let size = null;
    let color = null;
    if (rawMetadata) {
      try {
        const metadata = JSON.parse(rawMetadata);
        if (typeof metadata.position === 'string') {
          const [left, top] = metadata.position.split(',').map(parseFloat);
          if (!isNaN(left) && !isNaN(top)) {
            position = { x: left, y: top };
          }
        }
        if (typeof metadata.parent === 'string') {
          parent = metadata.parent;
        }
        if (typeof metadata.size === 'string') {
          const [w, h] = metadata.size.split(',').map(parseFloat);
          if (!isNaN(w) && !isNaN(h)) {
            size = { width: w, height: h };
          }
        }
        if (typeof metadata.color === 'string') {
          color = metadata.color;
        }
      } catch (e) {
        console.warn(`Aviso: Falha ao ler metadados do nó ${title}`);
      }
    }

    const id = String(nodeId++);
    idMap[title] = id;

    passages.push({
      id,
      type: nodeType,
      position,
      ...(nodeType === 'zone' ? { style: size || { width: 300, height: 200 } } : {}),
      data: { 
        label: title, 
        nodeType, 
        content, 
        tags, 
        choices: [],
        ...(parent ? { parentName: parent } : {}),
        ...(size ? { size } : {}),
        ...(color ? { color } : {})
      }
    });
  });

  // 2.5 Resolver parent-child relationships e ajustar posições relativas
  passages.forEach(p => {
    if (p.data.parentName) {
      const parentId = idMap[p.data.parentName];
      if (parentId) {
        const parentNode = passages.find(parent => parent.id === parentId);
        if (parentNode) {
          p.parentId = parentId;
          p.extent = 'parent';
          // Converter posição absoluta em relativa ao pai
          p.position = {
            x: p.position.x - parentNode.position.x,
            y: p.position.y - parentNode.position.y
          };
        }
      }
    }
  });

  // 3. Fase do Grafo: Extrair Ligações (Arestas) e Povoar Escolhas Visuais
  const edges = [];
  passages.forEach((p) => {
    let choiceCounter = 1;

    // --- PADRÃO 1: Links normais do Twine (Suporta |, ->, <- e simples) ---
    const linkRegex = /\[\[(.*?)\]\]/g;
    let linkMatch;
    
    while ((linkMatch = linkRegex.exec(p.data.content))) {
      let rawContent = linkMatch[1];
      let rawChoiceText = '';
      let targetTitle = '';

      if (rawContent.includes('|')) {
        const parts = rawContent.split('|');
        rawChoiceText = parts[0].trim();
        targetTitle = parts[1].trim();
      } else if (rawContent.includes('->')) {
        const parts = rawContent.split('->');
        rawChoiceText = parts[0].trim();
        targetTitle = parts[1].trim();
      } else if (rawContent.includes('<-')) {
        const parts = rawContent.split('<-');
        targetTitle = parts[0].trim();
        rawChoiceText = parts[1].trim();
      } else {
        rawChoiceText = rawContent.trim();
        targetTitle = rawContent.trim();
      }

      // BARREIRA ANTI-VARIÁVEIS
      if (targetTitle.startsWith('$') || targetTitle.startsWith('_') || targetTitle.match(/[\(\)\+\-\*\/\=]/)) {
        warnings.push(`Em [${p.data.label}], o link para "${targetTitle}" foi ignorado por conter variáveis ou matemática.`);
        continue;
      }

      const targetId = idMap[targetTitle];

      if (targetId) {
        const choiceId = `c-${p.id}-${choiceCounter++}`;
        p.data.choices.push({ id: choiceId, text: rawChoiceText, target: targetId });
        edges.push({ id: `e${p.id}-${targetId}-${choiceId}`, source: p.id, sourceHandle: choiceId, target: targetId });
      }
    }

    // --- PADRÃO 2: Macros do SugarCube <<link "Texto">> ... <<goto "Destino">> <</link>> ---
    const macroLinkRegex = /<<link\s+"([^"]+)"\s*>>([\s\S]*?)<<\/link>>/g;
    let macroMatch;
    
    while ((macroMatch = macroLinkRegex.exec(p.data.content))) {
      const choiceText = macroMatch[1].trim(); 
      const innerContent = macroMatch[2];      

      const gotoRegex = /<<goto\s+(?:"([^"]+)"|'([^']+)'|([^>\s]+))\s*>>/;
      const gotoMatch = gotoRegex.exec(innerContent);
      const gotoTarget = gotoMatch ? (gotoMatch[1] || gotoMatch[2] || gotoMatch[3]) : null;

      const variavelDestinoRegex = /<<set\s+\$(?:passagem_retorno|proximo_destino)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^>\s]+))\s*>>/;
      const variavelMatch = variavelDestinoRegex.exec(innerContent);
      const varTarget = variavelMatch ? (variavelMatch[1] || variavelMatch[2] || variavelMatch[3]) : null;

      let targetTitleRaw = varTarget || gotoTarget;
      if (targetTitleRaw) targetTitleRaw = targetTitleRaw.trim();

      if (targetTitleRaw) {
        // BARREIRA ANTI-VARIÁVEIS EM MACROS
        if (targetTitleRaw.startsWith('$') || targetTitleRaw.startsWith('_')) {
           warnings.push(`Em [${p.data.label}], o macro <<goto>> para "${targetTitleRaw}" foi ignorado por apontar para uma variável.`);
           continue; 
        }

        const targetId = idMap[targetTitleRaw];

        if (targetId) {
          const choiceId = `c-${p.id}-${choiceCounter++}`;
          p.data.choices.push({ id: choiceId, text: choiceText, target: targetId });
          edges.push({ id: `e${p.id}-${targetId}-${choiceId}`, source: p.id, sourceHandle: choiceId, target: targetId });
        }
      }
    }
  });

  // 4. Auto-layout apenas para nós que vieram com coordenadas a zero (sem metadados)
  const needsLayout = passages.every(p => p.position.x === 0 && p.position.y === 0);
  let nodes = passages;
  if (needsLayout && edges.length > 0) {
    nodes = layoutNodesAndEdges(passages, edges, 'TB');
  }

  // Devolve tudo direitinho, incluindo os avisos para o ecrã laranja
  return { nodes, edges, warnings };
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

  let result = '';
  
  nodes.forEach((n) => {
    const label = labelMap[n.id];

    // Uniformizar a leitura de tags (suporta Arrays ou Strings separadas por vírgula)
    let rawTags = n.data.tags || "";
    let tagsArray = Array.isArray(rawTags) 
      ? [...rawTags] 
      : String(rawTags).split(',').map(t => t.trim()).filter(t => t !== "");

    // Restaurar tags obrigatórias baseadas no Node Type
    if (n.data.nodeType === 'javascript' && !tagsArray.includes('script')) tagsArray.push('script');
    if (n.data.nodeType === 'css' && !tagsArray.includes('stylesheet')) tagsArray.push('stylesheet');
    if (n.data.nodeType === 'zone' && !tagsArray.includes('zone')) tagsArray.push('zone');

    const tags = tagsArray.length > 0 ? ` [${tagsArray.map(escapeForTweeHeader).join(' ')}]` : '';

    // Gerar JSON de posição seguro
    // Se o nó tiver um pai, a sua posição guardada no estado é relativa. Temos de convertê-la de volta a absoluta para exportação!
    let absoluteX = n.position.x;
    let absoluteY = n.position.y;
    
    if (n.parentId) {
      const parentNode = nodes.find(parent => parent.id === n.parentId);
      if (parentNode) {
        // Posição absoluta = posição do pai + posição relativa do filho
        absoluteX = (parentNode.position.x || 0) + (n.position.x || 0);
        absoluteY = (parentNode.position.y || 0) + (n.position.y || 0);
      }
    }

    const metadataObj = { position: `${Math.round(absoluteX)},${Math.round(absoluteY)}` };
    
    if (n.parentId) {
      const parentNode = nodes.find(parent => parent.id === n.parentId);
      if (parentNode) {
        metadataObj.parent = parentNode.data.label;
      }
    }
    
    if (n.type === 'zone' || n.data.nodeType === 'zone') {
      const w = n.style?.width || n.width || n.data.size?.width || 300;
      const h = n.style?.height || n.height || n.data.size?.height || 200;
      metadataObj.size = `${Math.round(w)},${Math.round(h)}`;
      if (n.data.color) {
        metadataObj.color = n.data.color;
      }
    }

    const metadata = ` ${JSON.stringify(metadataObj).replace(/\s+/g, '')}`;

    // Escapar duplos pontos no meio do texto
    let content = escapeForTweeText(n.data.content || '');

    result += `:: ${label}${tags}${metadata}\n${content}\n\n`;
  });
  
  return result.trim();
}
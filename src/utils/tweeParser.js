import { layoutNodesAndEdges } from '../dagreLayout';

// --- FUNÇÕES DE SEGURANÇA (Baseadas no Parser Oficial) ---

export function escapeForTweeHeader(value) {
  return value.replace(/\\/g, '\\\\').replace(/([[\]{}])/g, '\\$1');
}

export function escapeForTweeText(value) {
  // FIX #8: Primeiro protege os escapes manuais já existentes (\::),
  // depois escapa os :: literais que ainda não estão escapados.
  // eslint-disable-next-line no-control-regex
  return value.replace(/^\\::/gm, '\x00ESCAPED_COLONS\x00').replace(/^::/gm, '\\::').replace(/^\x00ESCAPED_COLONS\x00/gm, '\\::');
}

export function unescapeForTweeHeader(value) {
  return value.replace(/\\([[\]{}])/g, '$1').replace(/\\\\/g, '\\');
}

export function unescapeForTweeText(value) {
  // FIX #1: O padrão estava errado — deve reverter \:: para ::, não \: para :
  return value.replace(/^\\::/gm, '::');
}

// --- IMPORTAÇÃO (Leitura do Ficheiro) ---

export function parseTwee3(source) {
  // Array dedicado para guardar os avisos detetados durante a leitura
  const warnings = [];

  // 1. Separação segura por nós, garantindo que o :: está no início da linha
  const passageBlocks = source
    .split(/^::/m)
    .filter(s => s.trim() !== '')
    .map(s => '::' + s); // FIX #2: sem espaço extra para não prefixar o nome com ' '

  const passages = [];
  const idMap = {};
  let nodeId = 1;

  // 2. Extração Segura de Cabeçalhos e Metadados
  passageBlocks.forEach(block => {
    const lines = block.split(/\r?\n/);
    const headerLine = lines[0];

    // FIX #5: Em vez de regex não-greedy para o JSON (que falha com objetos aninhados),
    // encontramos o índice do primeiro '{' e extraímos o resto manualmente.
    // A regex continua a ser usada para Nome e Tags, mas o JSON é extraído à parte.
    const headerWithoutJson = headerLine.replace(/\{[\s\S]*$/, '').trimEnd();
    const headerBits = /^::\s*(.*?(?:\\\s)?)\s*(\[.*?\])?\s*$/.exec(headerWithoutJson);

    if (!headerBits) return; // Ignora blocos corrompidos

    const [, rawName, rawTags] = headerBits;
    if (!rawName || rawName.trim() === '') return;

    // Extrair o JSON a partir do primeiro '{' na linha original
    const jsonStart = headerLine.indexOf('{');
    let rawMetadata = null;
    if (jsonStart !== -1) {
      rawMetadata = headerLine.slice(jsonStart);
    }

    const title = unescapeForTweeHeader(rawName.trim());
    const content = lines.slice(1).join('\n').replace(/^\\::/gm, '::').trim();

    // FIX #7: Detetar nomes duplicados e emitir aviso
    if (idMap[title] !== undefined) {
      warnings.push(`Aviso: Passagem com o nome duplicado "${title}" encontrada — a segunda ocorrência foi ignorada.`);
      return;
    }

    let tags = [];
    if (rawTags) {
      // FIX #6: Usar /\s+/ em vez de /\s/ para tratar múltiplos espaços e tabs
      tags = rawTags.replace(/^\[(.*)\]$/g, '$1').split(/\s+/).filter(t => t.trim() !== '').map(unescapeForTweeHeader);
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
        console.warn(`Aviso: Falha ao ler metadados do nó "${title}"`);
      }
    }

    const id = String(nodeId++);
    idMap[title] = id;

    passages.push({
      id,
      type: nodeType,
      position,
      ...(nodeType === 'zone' ? { style: { ...(size || { width: 300, height: 200 }), pointerEvents: 'none' } } : {}),
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
      if (targetTitle.startsWith('$') || targetTitle.startsWith('_') || targetTitle.match(/[()+\-*/=]/)) {
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

  // 4. FIX #3: Auto-layout — nós filhos têm posição relativa 0,0 por design,
  // por isso só contam os nós raiz (sem parentName) para decidir se é preciso layout.
  const rootPassages = passages.filter(p => !p.data.parentName);
  const needsLayout = rootPassages.length > 0 && rootPassages.every(p => p.position.x === 0 && p.position.y === 0);
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

    // FIX #4: Calcular parentNode uma única vez e reutilizar nas duas operações seguintes
    const parentNode = n.parentId ? nodes.find(p => p.id === n.parentId) : null;

    // Se o nó tiver um pai, a sua posição guardada no estado é relativa.
    // Temos de convertê-la de volta a absoluta para exportação.
    let absoluteX = n.position.x;
    let absoluteY = n.position.y;
    
    if (parentNode) {
      absoluteX = (parentNode.position.x || 0) + (n.position.x || 0);
      absoluteY = (parentNode.position.y || 0) + (n.position.y || 0);
    }

    const metadataObj = { position: `${Math.round(absoluteX)},${Math.round(absoluteY)}` };
    
    if (parentNode) {
      metadataObj.parent = parentNode.data.label;
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
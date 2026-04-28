// src/utils/sugarcubeLogic.js

// 1. Encontrar o nó de início independentemente de como foi definido
export function findStartNode(nodes) {
  let startNode = nodes.find(n => {
    const tags = Array.isArray(n.data.tags) ? n.data.tags.join(' ').toLowerCase() : String(n.data.tags || "").toLowerCase();
    return tags.includes('start');
  });
  if (!startNode) startNode = nodes.find(n => n.data.label.toLowerCase() === 'start') || nodes[0];
  return startNode;
}

// 2. Extrair e aplicar macros <<set>> ao estado atual
export function applyModifiers(content, currentState) {
  const newState = { ...currentState };
  if (!content) return newState;

  const modRegex = /<<set\s+\$([\w_]+)\s*(?:to|=)\s*(true|false)\s*>>/gi;
  let match;
  while ((match = modRegex.exec(content))) {
    newState[match[1]] = match[2].toLowerCase() === 'true';
  }
  return newState;
}

// 3. Obter o estado inicial (lendo o StoryInit, se existir)
export function getInitialState(nodes) {
  const initNode = nodes.find(n => n.data.label.toLowerCase() === 'storyinit');
  return applyModifiers(initNode ? initNode.data.content : "", {});
}

// 4. Testar se uma escolha específica passa nas condições <<if>> onde está contida
export function canAccessChoice(content, choiceText, currentState) {
  if (!content) return true;
  
  const ifRegex = /<<if\s+\$?([\w_]+)\s*(?:is|==)?\s*(true|false)?\s*>>([\s\S]*?)<<\/if>>/gi;
  let match;
  let canPass = true;

  while ((match = ifRegex.exec(content))) {
    const varName = match[1];
    const expected = match[2] ? match[2].toLowerCase() === 'true' : true;
    const innerContent = match[3];

    // Se o link da escolha estiver escrito dentro deste bloco <<if>>
    if (innerContent.includes(choiceText)) {
      const currentVal = currentState[varName] === undefined ? false : currentState[varName];
      if (currentVal !== expected) {
        canPass = false; // A condição falhou
      }
    }
  }
  return canPass;
}

// 5. Verificar se é um nó de sistema (para esconder de relatórios de erros)
export function isSystemNode(node) {
  const systemNodes = ['storyinit', 'storytitle', 'storydata', 'storycaption'];
  const labelLower = node.data.label.toLowerCase();
  const tags = Array.isArray(node.data.tags) ? node.data.tags.join(' ').toLowerCase() : String(node.data.tags || "").toLowerCase();
  
  return systemNodes.includes(labelLower) || tags.includes('secreto');
}
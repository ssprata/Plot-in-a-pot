// src/utils/sugarcubeLogic.js

// --- TRADUTOR SUGARCUBE -> JAVASCRIPT ---
// Converte os operadores textuais do Twine para operadores lógicos puros
function sanitizeSugarCubeExpression(expr) {
  return expr
    .replace(/\bis\b/g, '===')
    .replace(/\beq\b/g, '===')
    .replace(/\bneq\b/g, '!==')
    .replace(/\band\b/g, '&&')
    .replace(/\bor\b/g, '||')
    .replace(/\bto\b/g, '=')
    .replace(/\$([a-zA-Z0-9_]+)/g, 'state.$1'); // Transforma $ouro em state.ouro
}

// 1. Encontrar o nó de início
export function findStartNode(nodes) {
  let startNode = nodes.find(n => {
    const tags = Array.isArray(n.data.tags) ? n.data.tags.join(' ').toLowerCase() : String(n.data.tags || "").toLowerCase();
    return tags.includes('start');
  });
  if (!startNode) startNode = nodes.find(n => n.data.label.toLowerCase() === 'start') || nodes[0];
  return startNode;
}

// 2. Extrair e aplicar macros <<set>> ao estado atual (Agora suporta matemática e strings)
export function applyModifiers(content, currentState) {
  const newState = { ...currentState };
  if (!content) return newState;

  const setRegex = /<<set\s+(.+?)\s*>>/gi;
  let match;

  while ((match = setRegex.exec(content))) {
    const expression = match[1]; 
    const jsExpression = sanitizeSugarCubeExpression(expression);

    try {
      // Cria um ambiente isolado (sandbox) onde a única variável disponível é o 'state'
      const evaluator = new Function('state', `${jsExpression};`);
      evaluator(newState);
    } catch (e) {
      console.warn("Expressão <<set>> complexa ou mal formatada ignorada:", expression);
    }
  }
  return newState;
}

// 3. Obter o estado inicial lendo o StoryInit
export function getInitialState(nodes) {
  const initNode = nodes.find(n => n.data.label.toLowerCase() === 'storyinit');
  return applyModifiers(initNode ? initNode.data.content : "", {});
}

// 4. Testar se uma escolha passa nas condições <<if>> (Agora suporta lógica avançada)
export function canAccessChoice(content, choiceText, currentState) {
  if (!content) return true;
  
  // Nota: Esta versão suporta blocos <<if>> simples. Não processa <<else>> ou <<elseif>> aninhados
  const ifRegex = /<<if\s+(.+?)\s*>>([\s\S]*?)<<\/if>>/gi;
  let match;
  let canPass = true;

  while ((match = ifRegex.exec(content))) {
    const expression = match[1];
    const innerContent = match[2];

    if (innerContent.includes(choiceText)) {
      const jsExpression = sanitizeSugarCubeExpression(expression);
      try {
        const evaluator = new Function('state', `return ${jsExpression};`);
        const result = evaluator(currentState);
        
        if (!result) {
          canPass = false;
        }
      } catch (e) {
        console.warn("Aviso: Falha ao avaliar condição:", expression);
        canPass = false; // Bloqueia por segurança se a lógica estiver corrompida
      }
    }
  }
  return canPass;
}

// 5. Verificar se é um nó de sistema
export function isSystemNode(node) {
  const systemNodes = ['storyinit', 'storytitle', 'storydata', 'storycaption'];
  const labelLower = node.data.label.toLowerCase();
  const tags = Array.isArray(node.data.tags) ? node.data.tags.join(' ').toLowerCase() : String(node.data.tags || "").toLowerCase();
  
  return systemNodes.includes(labelLower) || tags.includes('secreto');
}
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
// 1. Encontrar o nó de início
export function findStartNode(nodes) {
    // 1º Tentativa: Encontrar pela tag "start"
    let startNode = nodes.find(n => {
        const tags = Array.isArray(n.data.tags) ? n.data.tags.join(' ').toLowerCase() : String(n.data.tags || "").toLowerCase();
        return tags.includes('start');
    });

    // 2º Tentativa: Ler o JSON do StoryData (para ficheiros importados)
    if (!startNode) {
        const storyDataNode = nodes.find(n => n.data.label.toLowerCase() === 'storydata');
        if (storyDataNode && storyDataNode.data.content) {
            try {
                const storyData = JSON.parse(storyDataNode.data.content);
                if (storyData.start) {
                    startNode = nodes.find(n => n.data.label === storyData.start);
                }
            } catch (e) {
                // Ignorar se o JSON estiver corrompido
                console.warn("Aviso: Falha ao ler StoryData para encontrar nó de início:", e);
            }
        }
    }

    // 3º Tentativa: Procurar um nó especificamente chamado "start"
    if (!startNode) {
        startNode = nodes.find(n => n.data.label.toLowerCase() === 'start');
    }

    // 4º Tentativa (Fallback de Segurança): O primeiro nó do grafo que NÃO seja um nó de sistema
    if (!startNode) {
        startNode = nodes.find(n => !isSystemNode(n)) || nodes[0];
    }

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

// 4. Testar se uma escolha passa nas condições <<if>>, <<elseif>> e <<else>>
export function canAccessChoice(content, choiceText, currentState) {
  // 1. VERIFICAÇÃO DE SEGURANÇA
  // Se não houver texto, não há restrições. A porta está aberta.
  if (!content) return true;
  
  // Por defeito, assumimos que a escolha está livre, a não ser que o algoritmo prove o contrário.
  let isAccessible = true;

  // 2. ENCONTRAR OS BLOCOS COMPLETOS
  // Expressão regular para capturar tudo entre um <<if>> e o seu <</if>> final
  const fullIfRegex = /<<if\s+(.+?)\s*>>([\s\S]*?)<<\/if>>/gi;
  let ifMatch;

  // O ciclo percorre todos os blocos condicionais que existirem no texto do nó
  while ((ifMatch = fullIfRegex.exec(content))) {
    const entireBlock = ifMatch[0];       // O texto total do bloco
    const initialExpression = ifMatch[1]; // A condição do primeiro <<if>>
    const innerContent = ifMatch[2];      // O texto que está lá dentro

    // 3. FILTRAGEM RÁPIDA
    // Se a nossa escolha não estiver escrita dentro deste bloco específico, 
    // ignoramos este bloco inteiro e passamos ao próximo da lista.
    if (!entireBlock.includes(choiceText)) {
      continue;
    }

    // 4. DIVISÃO EM RAMIFICAÇÕES (BRANCHES)
    // Sabemos que a escolha está cá dentro. Vamos dividir o conteúdo interno
    // sempre que encontrarmos uma tag <<elseif>> ou <<else>>.
    const branches = [
      { condition: initialExpression, text: '' } // A primeira ramificação é o <<if>> original
    ];

    // Esta expressão regular isola as tags de separação
    const splitRegex = /(<<elseif\s+[^>]+>>|<<else>>)/gi;
    
    // O comando split vai criar uma lista alternada: [texto, tag, texto, tag, texto...]
    const pieces = innerContent.split(splitRegex);
    
    // O primeiro pedaço de texto pertence sempre ao <<if>> inicial
    branches[0].text = pieces[0];

    // O ciclo seguinte agrupa as restantes tags com os seus respetivos textos
    for (let i = 1; i < pieces.length; i += 2) {
       const tag = pieces[i];
       const text = pieces[i + 1] || ''; // O texto que vem logo a seguir à tag
       
       let cond = 'true'; // Se a tag for um <<else>>, a condição é sempre verdadeira
       
       if (tag.toLowerCase().startsWith('<<elseif')) {
           // Se for um <<elseif>>, extraímos a fórmula matemática que está lá dentro
           const exprMatch = tag.match(/<<elseif\s+(.+?)\s*>>/i);
           if (exprMatch) cond = exprMatch[1];
       }
       
       branches.push({ condition: cond, text: text });
    }

    // 5. AVALIAÇÃO DE CIMA PARA BAIXO
    // Vamos testar as condições pela ordem em que o autor as escreveu.
    let activeBranchIndex = -1; // -1 significa que ainda nenhuma condição foi cumprida

    for (let i = 0; i < branches.length; i++) {
       const jsExpr = sanitizeSugarCubeExpression(branches[i].condition);
       let isTrue = false;
       
       try {
          // Usa o nosso tradutor seguro para testar a matemática da ramificação
          const evaluator = new Function('state', `return ${jsExpr};`);
          isTrue = !!evaluator(currentState);
       } catch (e) {
          console.warn("Aviso: Falha ao avaliar condição complexa:", branches[i].condition);
       }

       // A REGRAS DE OURO DO SUGARCUBE:
       // Se esta condição for verdadeira, este é o caminho que o jogador vai ver.
       // Interrompemos o ciclo imediatamente para não ler os <<elseif>> e <<else>> abaixo.
       if (isTrue) {
          activeBranchIndex = i;
          break; 
       }
    }

    // 6. VEREDITO FINAL
    // Sabemos qual foi a ramificação que ganhou (activeBranchIndex).
    // A escolha em que o jogador quer clicar está escrita dentro do texto dessa ramificação vencedora?
    if (activeBranchIndex !== -1 && branches[activeBranchIndex].text.includes(choiceText)) {
        isAccessible = true; // Sim, a escolha está visível e clicável!
    } else {
        // Não. Ou a condição falhou, ou a escolha está escondida dentro de um <<else>> que perdeu.
        isAccessible = false;
    }
  }

  return isAccessible;
}

// 5. Verificar se é um nó de sistema
export function isSystemNode(node) {
    const systemNodes = ['storyinit', 'storytitle', 'storydata', 'storycaption'];
    const labelLower = node.data.label.toLowerCase();
    const tags = Array.isArray(node.data.tags) ? node.data.tags.join(' ').toLowerCase() : String(node.data.tags || "").toLowerCase();

    return systemNodes.includes(labelLower) || tags.includes('secreto');
}
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
  // Se não houver texto condicional no nó, não há restrições. A escolha está aberta.
  if (!content) return true;
  
  // Por defeito, assumimos que a escolha está livre, a não ser que a lógica prove o contrário.
  let isAccessible = true;

  // 2. ENCONTRAR OS BLOCOS COMPLETOS
  // Expressão regular para capturar tudo entre um <<if>> e o seu <</if>> final, 
  // capturando a condição inicial e todo o texto lá dentro.
  const fullIfRegex = /<<if\s+(.+?)\s*>>([\s\S]*?)<<\/if>>/gi;
  let ifMatch;

  // O ciclo percorre todos os blocos condicionais que existirem no texto do nó atual
  while ((ifMatch = fullIfRegex.exec(content))) {
    const entireBlock = ifMatch[0];       // O texto total do bloco (do if ao /if)
    const initialExpression = ifMatch[1]; // A condição matemática do primeiro <<if>>
    const innerContent = ifMatch[2];      // O texto e escolhas que estão lá dentro

    // 3. FILTRAGEM RÁPIDA
    // Se a escolha que estamos a analisar não estiver escrita dentro deste bloco específico, 
    // ignoramos este bloco inteiro para poupar processamento e passamos ao próximo.
    if (!entireBlock.includes(choiceText)) {
      continue;
    }

    // 4. DIVISÃO EM RAMIFICAÇÕES (BRANCHES)
    // Criamos uma lista de ramificações, começando sempre com a do <<if>> inicial.
    const branches = [
      { condition: initialExpression, text: '' }
    ];

    // CORREÇÃO APLICADA AQUI: 
    // Usamos [\s\S]+? para ler qualquer tipo de carácter (incluindo quebras de linha e símbolos matemáticos como > ou <) 
    // até encontrar estritamente os dois símbolos de fecho da etiqueta '>>'.
    const splitRegex = /(<<elseif\s+[\s\S]+?>>|<<else>>)/gi;
    
    // O comando split corta o texto em fatias, criando uma lista alternada: [texto, etiqueta, texto, etiqueta...]
    const pieces = innerContent.split(splitRegex);
    
    // O primeiro pedaço de texto pertence sempre à primeira condição (<<if>>)
    branches[0].text = pieces[0];

    // Este ciclo agrupa as restantes etiquetas (<<elseif>> ou <<else>>) com os seus respetivos textos
    for (let i = 1; i < pieces.length; i += 2) {
       const tag = pieces[i];
       const text = pieces[i + 1] || ''; // O texto que vem logo a seguir à etiqueta
       
       let cond = 'true'; // Se a etiqueta for um <<else>>, a condição é considerada sempre verdadeira
       
       // Se for um <<elseif>>, precisamos de extrair a fórmula matemática do interior da etiqueta
       if (tag.toLowerCase().startsWith('<<elseif')) {
           const exprMatch = tag.match(/<<elseif\s+(.+?)\s*>>/i);
           if (exprMatch) cond = exprMatch[1];
       }
       
       // Guardamos a ramificação na nossa lista para futura avaliação
       branches.push({ condition: cond, text: text });
    }

    // 5. AVALIAÇÃO EM CASCATA (DE CIMA PARA BAIXO)
    // Testamos as condições pela mesma ordem rigorosa em que o autor as escreveu.
    let activeBranchIndex = -1; // Começa a -1 porque ainda nenhuma condição foi cumprida

    for (let i = 0; i < branches.length; i++) {
       // Converte a sintaxe do SugarCube para JavaScript nativo (ex: 'is' para '===')
       const jsExpr = sanitizeSugarCubeExpression(branches[i].condition);
       let isTrue = false;
       
       try {
          // Cria uma função isolada para testar se a condição matemática da ramificação é verdadeira com as variáveis atuais
          const evaluator = new Function('state', `return ${jsExpr};`);
          isTrue = !!evaluator(currentState);
       } catch (e) {
          // Se a fórmula estiver mal escrita no texto, avisa na consola e falha por segurança
          console.warn("Aviso: Falha ao avaliar condição complexa:", branches[i].condition);
       }

       // A regra de ouro do SugarCube:
       // Assim que uma condição for verdadeira, validamos esse ramo e quebramos o ciclo.
       // Isto garante que o simulador ignora todos os <<elseif>> e <<else>> que estão abaixo.
       if (isTrue) {
          activeBranchIndex = i;
          break; 
       }
    }

    // 6. VEREDITO FINAL
    // Se encontrámos uma ramificação vencedora e o texto da escolha habita lá dentro, a porta abre.
    // Caso contrário (seja porque a condição da ramificação falhou ou porque a escolha está presa num bloco perdedor), a porta tranca.
    if (activeBranchIndex !== -1 && branches[activeBranchIndex].text.includes(choiceText)) {
        isAccessible = true;
    } else {
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
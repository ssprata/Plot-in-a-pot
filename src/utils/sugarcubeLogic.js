// src/utils/sugarcubeLogic.js

// FIX #5: Constante partilhada para a tag de nós secretos/sistema
// (deve ser a mesma usada no storyValidator.js)
export const SECRET_TAG = 'secreto';

// --- TRADUTOR SUGARCUBE -> JAVASCRIPT ---
// Converte os operadores textuais do Twine para operadores lógicos puros
function sanitizeSugarCubeExpression(expr) {
    return expr
        // FIX #1: "isnot" ANTES de "is" — caso contrário "isnot" torna-se "===not"
        .replace(/\bisnot\b/g, '!==')
        .replace(/\bneq\b/g,   '!==')
        .replace(/\bis\b/g,    '===')
        .replace(/\beq\b/g,    '===')
        .replace(/\band\b/g,   '&&')
        .replace(/\bor\b/g,    '||')
        // FIX #2: "to" só é substituído quando precedido de $variável e seguido de valor,
        // para não corromper strings que contenham a palavra "to" (ex: "to the castle")
        .replace(/(\$[\w]+)\s+\bto\b\s+/g, '$1 = ')
        .replace(/\$([a-zA-Z0-9_]+)/g, 'state.$1'); // Transforma $ouro em state.ouro
}

// FIX #4: Lista de propriedades proibidas para proteger o objeto de estado
// contra expressões maliciosas ou mal formatadas
const FORBIDDEN_STATE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function safeguardState(state) {
    FORBIDDEN_STATE_KEYS.forEach(key => {
        if (key in state) delete state[key];
    });
    return state;
}

// 1. Encontrar o nó de início
export function findStartNode(nodes) {
    // 1º Tentativa: Encontrar pela tag "start"
    let startNode = nodes.find(n => {
        const tags = Array.isArray(n.data.tags)
            ? n.data.tags.join(' ').toLowerCase()
            : String(n.data.tags || '').toLowerCase();
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
                console.warn("Aviso: Falha ao ler StoryData para encontrar nó de início:", e);
            }
        }
    }

    // 3º Tentativa: Procurar um nó especificamente chamado "start"
    if (!startNode) {
        startNode = nodes.find(n => n.data.label.toLowerCase() === 'start');
    }

    // 4º Tentativa (Fallback de Segurança): O primeiro nó que NÃO seja de sistema
    if (!startNode) {
        // FIX #6: Aviso explícito quando o fallback é usado — a travessia pode começar num nó errado
        const fallback = nodes.find(n => !isSystemNode(n)) || nodes[0];
        if (fallback) {
            console.warn(
                `[sugarcubeLogic] Nenhum nó de início encontrado — a usar "${fallback.data?.label || fallback.id}" como fallback. Define uma tag 'start' ou um nó StoryData com "start" para evitar este comportamento.`
            );
        }
        startNode = fallback;
    }

    return startNode;
}

// 2. Extrair e aplicar macros <<set>> ao estado atual
export function applyModifiers(content, currentState) {
    const newState = { ...currentState };
    if (!content) return newState;

    const setRegex = /<<set\s+(.+?)\s*>>/gi;
    let match;

    while ((match = setRegex.exec(content))) {
        const expression = match[1];
        const jsExpression = sanitizeSugarCubeExpression(expression);

        try {
            // FIX #4: Sandbox com proteção contra mutação de propriedades perigosas
            const evaluator = new Function('state', `${jsExpression};`);
            evaluator(newState);
            safeguardState(newState);
        } catch (e) {
            console.warn("Expressão <<set>> complexa ou mal formatada ignorada:", expression);
        }
    }
    return newState;
}

// 3. Obter o estado inicial lendo o StoryInit
export function getInitialState(nodes) {
    const initNode = nodes.find(n => n.data.label.toLowerCase() === 'storyinit');
    return applyModifiers(initNode ? initNode.data.content : '', {});
}

// 4. Testar se uma escolha passa nas condições <<if>>, <<elseif>> e <<else>>
export function canAccessChoice(content, choiceText, currentState) {
    if (!content) return true;

    // FIX #7: Rastrear explicitamente se a escolha foi encontrada em algum bloco
    // Em vez de depender do valor acidental de isAccessible no final
    let choiceFoundInAnyBlock = false;
    let isAccessible = true;

    const fullIfRegex = /<<if\s+(.+?)\s*>>([\s\S]*?)<<\/if>>/gi;
    let ifMatch;

    while ((ifMatch = fullIfRegex.exec(content))) {
        const entireBlock = ifMatch[0];
        const initialExpression = ifMatch[1];
        const innerContent = ifMatch[2];

        // FIX #3: Filtragem mais robusta — verificar se a escolha está no bloco
        // usando o formato exato de link em vez de substring livre
        // (reduz falsos positivos com textos de escolha genéricos)
        const choicePattern = new RegExp(
            '\\[\\[' + choiceText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[|\\]\\->]'
        );
        if (!choicePattern.test(entireBlock) && !entireBlock.includes(`[[${choiceText}]]`)) {
            continue;
        }

        choiceFoundInAnyBlock = true;

        const branches = [{ condition: initialExpression, text: '' }];
        const splitRegex = /(<<elseif\s+[\s\S]+?>>|<<else>>)/gi;
        const pieces = innerContent.split(splitRegex);
        branches[0].text = pieces[0];

        for (let i = 1; i < pieces.length; i += 2) {
            const tag = pieces[i];
            const text = pieces[i + 1] || '';
            let cond = 'true';
            if (tag.toLowerCase().startsWith('<<elseif')) {
                const exprMatch = tag.match(/<<elseif\s+(.+?)\s*>>/i);
                if (exprMatch) cond = exprMatch[1];
            }
            branches.push({ condition: cond, text });
        }

        let activeBranchIndex = -1;
        for (let i = 0; i < branches.length; i++) {
            const jsExpr = sanitizeSugarCubeExpression(branches[i].condition);
            let isTrue = false;
            try {
                const evaluator = new Function('state', `return ${jsExpr};`);
                isTrue = !!evaluator(currentState);
            } catch (e) {
                console.warn("Aviso: Falha ao avaliar condição complexa:", branches[i].condition);
            }
            if (isTrue) {
                activeBranchIndex = i;
                break;
            }
        }

        // FIX #7: Resultado explícito — a escolha só é acessível se estiver
        // no ramo vencedor do bloco onde foi encontrada
        if (activeBranchIndex !== -1 && branches[activeBranchIndex].text.includes(choiceText)) {
            isAccessible = true;
        } else {
            isAccessible = false;
        }
    }

    // FIX #7: Se a escolha não foi encontrada em nenhum bloco condicional,
    // está livre (fora de qualquer <<if>>) — acessível por defeito
    if (!choiceFoundInAnyBlock) return true;

    return isAccessible;
}

// 5. Verificar se é um nó de sistema
export function isSystemNode(node) {
    const systemNodes = ['storyinit', 'storytitle', 'storydata', 'storycaption'];
    const labelLower = node.data.label.toLowerCase();
    // FIX #5: Usar SECRET_TAG exportada em vez de string hardcoded duplicada
    const tags = Array.isArray(node.data.tags)
        ? node.data.tags.join(' ').toLowerCase()
        : String(node.data.tags || '').toLowerCase();

    return systemNodes.includes(labelLower) || tags.includes(SECRET_TAG);
}
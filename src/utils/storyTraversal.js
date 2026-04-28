// src/utils/storyTraversal.js
import { findStartNode, getInitialState, applyModifiers, canAccessChoice } from './sugarcubeLogic';

export function traverseGraph(nodes, edges) {
  // 1. ESTRUTURAS DE REGISTO
  // Utilizamos 'Sets' (conjuntos) para garantir que não há duplicados.
  // Servem para anotar "Eu já estive neste nó" ou "Eu já passei por esta porta".
  const reachableNodes = new Set();
  const reachableEdges = new Set();
  
  // Utilizamos um 'Map' para guardar o histórico das "mochilas" (o estado das variáveis)
  // com que o jogador entra em cada nó. Serve para evitar loops infinitos.
  const visitedStates = new Map();

  // 2. ARRANQUE DA SIMULAÇÃO
  // Descobre onde a história começa (seja pela tag 'start', nome 'Start' ou StoryData).
  const startNode = findStartNode(nodes);
  if (!startNode) return { reachableNodes, reachableEdges, error: "Nó de início não encontrado." };

  // Lê as variáveis iniciais definidas no nó StoryInit (ex: vida = 100, ouro = 0)
  const initialState = getInitialState(nodes);
  
  // Cria a 'Fila' (queue) de exploração. O algoritmo vai pegar numa opção de cada vez.
  // Começamos por colocar o nó inicial e a mochila inicial na fila.
  const queue = [{ nodeId: startNode.id, state: initialState }];

  // 3. O CICLO DE EXPLORAÇÃO (Breadth-First Search)
  // Enquanto houver caminhos na fila por explorar, o ciclo continua.
  while (queue.length > 0) {
    // Retira o primeiro elemento da fila de espera
    const { nodeId, state } = queue.shift();
    
    // Regista imediatamente que o jogador conseguiu alcançar este nó
    reachableNodes.add(nodeId);

    // Vai buscar os dados completos do nó à base de dados do grafo
    const currentNode = nodes.find(n => n.id === nodeId);
    if (!currentNode) continue; // Prevenção de erros caso o nó tenha sido apagado

    // 4. ATUALIZAÇÃO DO ESTADO (A "MOCHILA")
    // Lê o conteúdo do nó e aplica qualquer matemática ou alteração de variáveis.
    // Exemplo: se o texto tiver "<<set $ouro = $ouro + 10>>", o newState vai ter mais ouro que o state anterior.
    const newState = applyModifiers(currentNode.data.content, state);

    // 5. PREVENÇÃO DE LOOPS E OTIMIZAÇÃO
    // Converte o objeto de estado numa string para ser fácil de comparar (ex: '{"ouro":10,"vida":100}')
    const stateStr = JSON.stringify(newState);
    
    // Se o nó ainda não tiver um histórico, cria uma lista vazia para ele
    if (!visitedStates.has(nodeId)) visitedStates.set(nodeId, []);
    
    // Se o jogador já entrou neste nó no passado com EXATAMENTE os mesmos itens/variáveis,
    // não vale a pena voltar a testar os caminhos para a frente. Cancela e passa ao próximo.
    if (visitedStates.get(nodeId).includes(stateStr)) continue;

    // Disjuntor de Segurança: Impede que o browser congele num loop de "grinding"
    // Se o jogador andar às voltas a acumular ouro (estado muda sempre), paramos à 10ª vez.
    if (visitedStates.get(nodeId).length >= 10) {
      console.warn(`Loop infinito evitado no nó: ${currentNode?.data?.label}`);
      continue;
    }

    // Regista o estado atual no histórico deste nó para futuras comparações
    visitedStates.get(nodeId).push(stateStr);

    // 6. TESTAR AS SAÍDAS (PORTAS)
    // Encontra todas as setas (edges) que saem do nó onde estamos agora
    const outgoing = edges.filter(e => e.source === nodeId);
    
    outgoing.forEach(edge => {
      // Descobre qual é a escolha/texto que gerou esta seta
      const choice = currentNode.data.choices?.find(c => c.id === edge.sourceHandle);
      if (!choice) return;

      // 7. AVALIAÇÃO DE CONDIÇÕES
      // Pergunta à biblioteca SugarCube: "Com esta mochila (newState), o jogador cumpre 
      // os requisitos dos blocos <<if>> para clicar nesta escolha?"
      if (canAccessChoice(currentNode.data.content, choice.text, newState)) {
        // Se a resposta for sim, regista que esta seta é transitável (usado pelo Validator)
        reachableEdges.add(edge.id);
        
        // Coloca o nó de destino no final da fila de espera para ser explorado mais tarde,
        // enviando uma cópia da mochila ({ ...newState }) para esse futuro caminho.
        queue.push({ nodeId: edge.target, state: { ...newState } });
      }
    });
  }

  // 8. FINALIZAÇÃO
  // Quando a fila fica vazia, significa que o jogador invisível tentou todas as opções.
  // Devolve o relatório completo de onde conseguiu chegar.
  return { reachableNodes, reachableEdges, error: null };
}
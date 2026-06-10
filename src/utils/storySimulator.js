// src/utils/storySimulator.js
import { traverseGraph } from './storyTraversal';

export function runDevSimulationLog(nodes, edges) {
  // 1. Corre o motor principal para extrair o histórico completo de chegadas
  // O motor devolve os nós alcançados e o histórico (arrivalHistory) com o caminho e estado de variáveis
  const { reachableNodes, arrivalHistory, error } = traverseGraph(nodes, edges);

  // 2. Proteção de erro inicial
  // Se o nó inicial não existir, interrompe e avisa na consola
  if (error) {
    console.error("[Simulação Dev] Erro de Arranque:", error);
    return;
  }

  // FIX #3: Proteção contra arrivalHistory inválido (undefined ou não-Map)
  if (!arrivalHistory || typeof arrivalHistory.forEach !== 'function') {
    console.error("[Simulação Dev] Erro: arrivalHistory inválido ou indefinido — o motor de travessia devolveu um resultado inesperado.");
    return;
  }

  // FIX #4: Construir Map de id → node uma única vez fora do loop — O(N) em vez de O(N²)
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // FIX #2 + #5: Calcular nós inalcançáveis e listá-los pelo nome
  const unreachableNodes = nodes.filter(n => !reachableNodes.has(n.id));

  // 3. Inicia um grupo colapsável na consola para não poluir o terminal
  console.groupCollapsed("%c --- SIMULAÇÃO COMPLETA (DEV MODE) --- ", "background: #222; color: #bada55; font-size: 12px; font-weight: bold;");

  console.log(`Total de Nós Alcançáveis: ${reachableNodes.size} de ${nodes.length}`);

  // FIX #5: Listar nós inalcançáveis pelo nome se existirem
  if (unreachableNodes.length > 0) {
    console.warn(
      `[${unreachableNodes.length} nó(s) inalcançável(eis)]:`,
      unreachableNodes.map(n => n.data?.label || n.id)
    );
  }

  // 4. Itera sobre cada nó que tem um histórico de chegada registado
  // arrivalHistory é um Map onde a chave é o ID do nó e o valor é um array de formas de lá chegar
  arrivalHistory.forEach((histories, nodeId) => {

    // FIX #4: Lookup O(1) via Map em vez de nodes.find() O(N)
    const node = nodeMap.get(nodeId);
    const nodeName = node ? node.data.label : nodeId;

    // 5. Cria um subgrupo para cada nó
    console.groupCollapsed(`Nó: [${nodeName}] (${histories.length} rotas possíveis)`);

    // 6. Itera sobre cada variação de percurso para este nó específico
    histories.forEach((history, index) => {
      console.log(`%cRota ${index + 1}:`, "font-weight: bold; color: #4facfe;");

      // Imprime o trilho de migalhas (ex: Inicio -> Porta -> Fim)
      console.log(`Caminho: ${history.path.join(' -> ')}`);

      // Verifica se a "mochila" tem itens/variáveis.
      const stateKeys = Object.keys(history.state);

      if (stateKeys.length === 0) {
        // Se o jogo não tem variáveis ainda, avisa que está vazio para evitar imprimir tabelas em branco
        console.log("Estado: [Variáveis Vazias]");
      } else {
        // Usa console.table para desenhar uma tabela estruturada nativa do browser com as chaves e valores
        console.table(history.state);
      }
      console.log("------------------------");
    });

    // Fecha o subgrupo deste nó específico
    console.groupEnd();
  });

  // Fecha o grupo principal da simulação inteira
  console.groupEnd();
}
// src/utils/storySimulator.js
import { traverseGraph } from './storyTraversal';

export function runDevSimulationLog(nodes, edges) {
  // 1. Corre o motor principal para extrair o histórico completo de chegadas
  const { reachableNodes, arrivalHistory, error } = traverseGraph(nodes, edges);

  // 2. Proteção de erro inicial
  if (error) {
    console.error("[Simulação Dev] Erro de Arranque:", error);
    return;
  }

  // 3. Inicia um grupo colapsável na consola para não poluir o terminal
  console.groupCollapsed("%c --- SIMULAÇÃO COMPLETA (DEV MODE) --- ", "background: #222; color: #bada55; font-size: 12px; font-weight: bold;");
  console.log(`Total de Nós Alcançáveis: ${reachableNodes.size} de ${nodes.length}`);

  // 4. Itera sobre cada nó que tem um histórico de chegada registado
  arrivalHistory.forEach((histories, nodeId) => {
    // Procura o nome do nó na base de dados para facilitar a leitura
    const node = nodes.find(n => n.id === nodeId);
    const nodeName = node ? node.data.label : nodeId;

    // 5. Cria um subgrupo para cada nó, indicando quantas formas existem de lá chegar
    console.groupCollapsed(`Nó: [${nodeName}] (${histories.length} rotas possíveis)`);

    // 6. Itera sobre cada variação de percurso para este nó específico
    histories.forEach((history, index) => {
      console.log(`%cRota ${index + 1}:`, "font-weight: bold; color: #4facfe;");
      console.log(`Caminho: ${history.path.join(' -> ')}`);
      
      // Verifica se a "mochila" tem itens. Se não tiver, avisa que está vazia.
      const stateKeys = Object.keys(history.state);
      if (stateKeys.length === 0) {
        console.log("Estado: [Variáveis Vazias]");
      } else {
        // Usa console.table para desenhar uma tabela perfeita com as chaves e valores
        console.table(history.state); 
      }
      console.log("------------------------");
    });

    // Fecha o subgrupo deste nó
    console.groupEnd();
  });

  // Fecha o grupo principal da simulação
  console.groupEnd();
}
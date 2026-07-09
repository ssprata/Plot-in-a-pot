// src/utils/storySimulator.js
import { traverseGraph } from './storyTraversal';

export function runDevSimulationLog(nodes, edges) {
  // 1. Executa a travessia do grafo para determinar nós alcançáveis e histórico de chegada
  const { reachableNodes, arrivalHistory, error } = traverseGraph(nodes, edges);

  if (error) {
    console.error("[Simulação Dev] Erro de Arranque:", error);
    return;
  }

  // 2. Valida se o histórico de chegada é um Map válido
  if (!arrivalHistory || typeof arrivalHistory.forEach !== 'function') {
    console.error("[Simulação Dev] Erro: arrivalHistory inválido ou indefinido — o motor de travessia devolveu um resultado inesperado.");
    return;
  }

  // 2. Cria um Map para lookup rápido de nós pelo ID
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // 4. Identifica nós inalcançáveis
  const unreachableNodes = nodes.filter(n => !reachableNodes.has(n.id));

  // 5. Log detalhado da simulação
  console.groupCollapsed("%c --- SIMULAÇÃO COMPLETA (DEV MODE) --- ", "background: #222; color: #bada55; font-size: 12px; font-weight: bold;");

  console.log(`Total de Nós Alcançáveis: ${reachableNodes.size} de ${nodes.length}`);

  // 6. Log dos nós inalcançáveis, se houver
  if (unreachableNodes.length > 0) {
    console.warn(
      `[${unreachableNodes.length} nó(s) inalcançável(eis)]:`,
      unreachableNodes.map(n => n.data?.label || n.id)
    );
  }

  // 7. Itera sobre cada nó que tem um histórico de chegada registado
  arrivalHistory.forEach((histories, nodeId) => {

    const node = nodeMap.get(nodeId);
    const nodeName = node ? node.data.label : nodeId;

    console.groupCollapsed(`Nó: [${nodeName}] (${histories.length} rotas possíveis)`);

    // 8. Itera sobre cada variação de percurso para este nó específico
    histories.forEach((history, index) => {
      console.log(`%cRota ${index + 1}:`, "font-weight: bold; color: #4facfe;");
      console.log(`Caminho: ${history.path.join(' -> ')}`);
      const stateKeys = Object.keys(history.state);

      if (stateKeys.length === 0) {
        console.log("Estado: [Variáveis Vazias]");
      } else {
        console.table(history.state);
      }
      console.log("------------------------");
    });
    console.groupEnd();
  });
  console.groupEnd();
}
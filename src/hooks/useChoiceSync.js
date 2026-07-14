import { useCallback } from 'react';
import { flushSync } from 'react-dom';
import { updateLinkInText } from '../utils/textParsing';

/**
 * Custom hook that manages choice synchronization from node text content
 * and handles connection confirmations from the ConnectionModal.
 *
 * @param {Object} params
 * @param {React.MutableRefObject} params.nodesRef - Ref to current nodes array
 * @param {Function} params.setNodes - ReactFlow setNodes updater
 * @param {Function} params.setEdges - ReactFlow setEdges updater
 * @param {Function} params.setPendingConnection - Setter to clear the pending connection state
 * @returns {{ syncChoicesFromText: Function, handleConnectionConfirm: Function }}
 */
export function useChoiceSync({ nodesRef, setNodes, setEdges, setPendingConnection }) {

  // --- Sync de Escolhas a partir do Texto (usa nodesRef para evitar dependência em `nodes`) ---
  const syncChoicesFromText = useCallback((nodeId, text) => {
    const localWarnings = [];
    const newChoices = [];
    const newEdgesPatch = [];
    let choiceIndex = 0;

    // Usa ref para leitura sem tornar `nodes` uma dependência do callback
    const currentNodes = nodesRef.current;

    // --- PADRÃO 1: Links normais do Twine ---
    const linkRegex = /\[\[(.*?)(?:\||-\>)(.*?)\]\]|\[\[(.*?)\]\]/g;
    let match;

    while ((match = linkRegex.exec(text))) {
      const rawText = (match[1] !== undefined ? match[1] : match[3]) || '';
      const targetLabel = (match[2] !== undefined ? match[2] : (match[3] || '')).trim();
      let choiceText = rawText.trim();

      const translationMatch = choiceText.match(/^t\(['"]([^'"]+)['"]\)$/);
      if (translationMatch) choiceText = translationMatch[1];

      if (
        targetLabel.startsWith('$') ||
        targetLabel.startsWith('_') ||
        targetLabel.match(/[()+\-*\/=]/)
      ) {
        localWarnings.push(`A ligação para "${targetLabel}" foi bloqueada. Não uses variáveis no destino.`);
        continue;
      }

      const targetNode = currentNodes.find(n => n.data.label === targetLabel);
      const safeTarget = targetLabel.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '');
      const choiceId = `c-${nodeId}-${safeTarget}-${choiceIndex++}`;

      newChoices.push({ id: choiceId, text: choiceText, target: targetNode?.id || '' });

      if (targetNode) {
        newEdgesPatch.push({
          id: `e-${nodeId}-${targetNode.id}-${choiceId}`,
          source: nodeId,
          sourceHandle: choiceId,
          target: targetNode.id
        });
      } else {
        localWarnings.push(`A ligação para "${targetLabel}" aponta para um nó inexistente no grafo.`);
      }
    }

    // --- PADRÃO 2: Macros do SugarCube ---
    const macroLinkRegex = /<<link\s+"([^"]+)"\s*>>([\s\S]*?)<<\/link>>/g;
    let macroMatch;

    while ((macroMatch = macroLinkRegex.exec(text))) {
      let choiceText = macroMatch[1].trim();
      const innerContent = macroMatch[2];

      const translationMatch = choiceText.match(/^t\(['"]([^'"]+)['"]\)$/);
      if (translationMatch) choiceText = translationMatch[1];

      const gotoRegex = /<<goto\s+(?:"([^"]+)"|'([^']+)'|([^>\s]+))\s*>>/;
      const gotoMatch = gotoRegex.exec(innerContent);
      const gotoTarget = gotoMatch ? (gotoMatch[1] || gotoMatch[2] || gotoMatch[3]) : null;

      const variavelDestinoRegex =
        /<<set\s+\$(?:passagem_retorno|proximo_destino)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^>\s]+))\s*>>/;
      const variavelMatch = variavelDestinoRegex.exec(innerContent);
      const varTarget = variavelMatch ? (variavelMatch[1] || variavelMatch[2] || variavelMatch[3]) : null;

      let targetTitleRaw = (varTarget || gotoTarget)?.trim();
      if (!targetTitleRaw) continue;

      if (targetTitleRaw.startsWith('$') || targetTitleRaw.startsWith('_')) {
        localWarnings.push(`O macro <<goto>> para "${targetTitleRaw}" foi bloqueado. Não uses variáveis no destino.`);
        continue;
      }

      const targetNode = currentNodes.find(n => n.data.label === targetTitleRaw);
      const safeTarget = targetTitleRaw.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '');
      const choiceId = `c-${nodeId}-${safeTarget}-${choiceIndex++}`;

      newChoices.push({ id: choiceId, text: choiceText, target: targetNode?.id || '' });

      if (targetNode) {
        newEdgesPatch.push({
          id: `e-${nodeId}-${targetNode.id}-${choiceId}`,
          source: nodeId,
          sourceHandle: choiceId,
          target: targetNode.id
        });
      } else {
        localWarnings.push(`O destino "${targetTitleRaw}" da macro <<goto>> ou link não existe no grafo.`);
      }
    }

    flushSync(() => {
      setNodes(nds =>
        nds.map(n =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, content: text, choices: newChoices, warnings: localWarnings } }
            : n
        )
      );
    });

    setEdges(eds => [...eds.filter(e => e.source !== nodeId), ...newEdgesPatch]);
  }, [setNodes, setEdges]); // `nodes` removido das dependências — leitura via nodesRef

  const handleConnectionConfirm = useCallback(({
    type, choiceText, params,
    ifVariable, ifOperator, ifValue,
    ifTargetNodeId, elseTargetNodeId
  }) => {
    setPendingConnection(null);

    const currentNodes = nodesRef.current;
    const sourceNode = currentNodes.find(n => n.id === params.source);
    if (!sourceNode) return;

    // Check if we are updating an existing choice
    const choiceIndex = params.sourceHandle && params.sourceHandle.startsWith('c-')
      ? (sourceNode.data.choices || []).findIndex(c => c.id === params.sourceHandle)
      : -1;

    if (type === 'simple') {
      const targetNode = currentNodes.find(n => n.id === params.target);
      if (!targetNode) return;
      const text = choiceText?.trim() || targetNode.data.label;

      let content = sourceNode.data.content || '';
      if (choiceIndex !== -1) {
        // Update existing choice
        content = updateLinkInText(content, choiceIndex, targetNode.data.label, choiceText?.trim());
      } else {
        // Append new choice
        const linkSyntax = `[[${text}|${targetNode.data.label}]]`;
        if (!content.includes(linkSyntax)) {
          if (content.length > 0 && !content.endsWith('\n')) content += '\n';
          content += linkSyntax;
        }
      }
      setTimeout(() => syncChoicesFromText(sourceNode.id, content), 0);
    } else {
      const ifNode = currentNodes.find(n => n.id === ifTargetNodeId);
      const elseNode = elseTargetNodeId ? currentNodes.find(n => n.id === elseTargetNodeId) : null;
      const ifText = choiceText?.trim() || ifNode?.data.label || 'Continuar';
      const elseText = elseNode?.data.label || 'Continuar';

      let content = sourceNode.data.content || '';

      let block = `<<if $${ifVariable} ${ifOperator} ${ifValue}>>\n`;
      block += `[[${ifText}|${ifNode?.data.label}]]\n`;
      if (elseNode) {
        block += `<<else>>\n[[${elseText}|${elseNode?.data.label}]]\n`;
      }
      block += `<</if>>`;

      if (choiceIndex !== -1) {
        content = updateLinkInText(content, choiceIndex, ifNode?.data.label, choiceText?.trim());
      } else {
        if (content.length > 0 && !content.endsWith('\n')) content += '\n';
        content += block;
      }

      setTimeout(() => syncChoicesFromText(sourceNode.id, content), 0);
    }
  }, [syncChoicesFromText]);

  return { syncChoicesFromText, handleConnectionConfirm };
}

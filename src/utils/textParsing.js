// src/utils/textParsing.js
// Pure helper functions extracted from App.jsx.
// These utilities handle text parsing, file downloads, system node formatting,
// and link-target replacement within Twee3/SugarCube markup.

// Regex compilado uma única vez
export const SET_VAR_REGEX = /<<set\s+\$([\w\d]+)\s*(?:to|=)\s*(.*?)>>/g;

export const parseVariablesFromText = (text = '') => {
  const vars = {};
  // Reseta o lastIndex para garantir comportamento correto com regex global reutilizado
  SET_VAR_REGEX.lastIndex = 0;
  let match;
  while ((match = SET_VAR_REGEX.exec(text)) !== null) {
    vars[match[1]] = match[2].trim();
  }
  return vars;
};

// Dispara o download de um ficheiro de texto no browser.
// Usado para exportar a história em formato Twee3.
export const triggerFileDownload = (content, filename) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
};

// Conjuntos estáticos reutilizados para detectar nós de sistema.
export const SYSTEM_NODE_NAMES = new Set(['storyinit', 'storytitle', 'storydata', 'storycaption']);

// Marca automaticamente nós de sistema com a tag 'secreto', para que possam ser
// tratados de forma diferente na interface e na validação.
export const formatSystemNodes = (nodes) =>
  nodes.map(n => {
    let tags = Array.isArray(n.data.tags) ? n.data.tags.join(', ') : String(n.data.tags || '');
    if (SYSTEM_NODE_NAMES.has(n.data.label.toLowerCase()) && !tags.includes('secreto')) {
      tags = tags ? `${tags}, secreto` : 'secreto';
    }
    return { ...n, data: { ...n.data, tags } };
  });

// Replaces the target (and optionally display text) of the choiceIndex-th link
// found in a Twee3/SugarCube text string.
// Supports [[text|target]], [[text->target]], [[target]], and <<link>> macros.
export const updateLinkInText = (textVal, choiceIndex, newTargetLabel, newDisplayText = null) => {
  let index = 0;
  const linkRegex = /(\[\[(.*?)(?:\||-\>)(.*?)\]\])|(\[\[(.*?)\]\])|(<<link\s+"([^"]+)"\s*>>([\s\S]*?)<<\/link>>)|(<<goto\s+(?:"([^"]+)"|'([^']+)'|([^>\s]+))\s*>>)/gi;

  return textVal.replace(linkRegex, (match, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12) => {
    if (index === choiceIndex) {
      index++;
      if (p1) {
        const separator = match.includes('->') ? '->' : '|';
        const text = newDisplayText !== null && newDisplayText !== '' ? newDisplayText : p2;
        return `[[${text}${separator}${newTargetLabel}]]`;
      } else if (p4) {
        if (newDisplayText !== null && newDisplayText !== '' && newDisplayText !== newTargetLabel) {
          return `[[${newDisplayText}|${newTargetLabel}]]`;
        }
        return `[[${newTargetLabel}]]`;
      } else if (p6) {
        const text = newDisplayText !== null && newDisplayText !== '' ? newDisplayText : p7;
        let inner = p8;
        const gotoRegex = /(<<goto\s+)(?:"[^"]+"|'[^']+'|[^>\s]+)(\s*>>)/;
        if (gotoRegex.test(inner)) {
          inner = inner.replace(gotoRegex, `$1"${newTargetLabel}"$2`);
        } else {
          const setVarRegex = /(<<set\s+\$(?:passagem_retorno|proximo_destino)\s*=\s*)(?:"[^"]+"|'[^']+'|[^>\s]+)(\s*>>)/;
          if (setVarRegex.test(inner)) {
            inner = inner.replace(setVarRegex, `$1"${newTargetLabel}"$2`);
          }
        }
        return `<<link "${text}">${inner}<</link>>`;
      } else if (p9) {
        if (p10 !== undefined) {
          return `<<goto "${newTargetLabel}">>`;
        } else if (p11 !== undefined) {
          return `<<goto '${newTargetLabel}'>>`;
        } else {
          return `<<goto ${newTargetLabel}>>`;
        }
      }
    }
    index++;
    return match;
  });
};

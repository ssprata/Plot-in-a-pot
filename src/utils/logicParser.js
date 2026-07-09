// Helper to parse SugarCube variables, links, and if/else conditions from text
export function parseLogicFromText(text = '') {
  const result = {
    narrative: '',
    setters: [],
    choices: []
  };

  const lines = text.split('\n');
  const narrativeLines = [];

  // regex para procurar padrões como: <<set $var to value>>
  const setRegex = /<<set\s+\$([\w]+)\s*(?:to|=)\s*(.*?)\s*>>/i;

  const linkRegexPipe = /^\[\[([^|\]]*)\|([^\]]+)\]\]$/;        // [[Texto|Destino]]
  const linkRegexArrow = /^\[\[([^>\]]*)->([^\]]+)\]\]$/;         // [[Texto->Destino]]
  const linkRegexBack = /^\[\[([^<\]]+)<-([^\]]*)\]\]$/;        // [[Destino<-Texto]]
  const linkRegexSimpl = /^\[\[([^\]|<>]+)\]\]$/;                 // [[Destino]]

  // regex para procurar blocos condicionais: <<if $var is value>>, <<else>>, <<endif>>
  const ifRegex = /<<if\s+\$([\w]+)\s*(is\s+not|isnot|gte|lte|gt|lt|==|!=|>=|<=|>|<|is)\s*(.*?)\s*>>/i;
  const elseRegex = /<<else>>/i;
  const endIfRegex = /<<\/if>>/i;

  let currentCondition = null;
  let choiceOrder = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (narrativeLines.length > 0 && !currentCondition) {
        narrativeLines.push('');
      }
      continue;
    }

    // --- Bloco IF ---
    if (ifRegex.test(trimmed)) {
      const match = trimmed.match(ifRegex);
      currentCondition = {
        variable: match[1],
        operator: match[2].replace(/\s+/g, ' ').trim(),
        value: match[3].trim(),
        isElse: false
      };
      continue;
    }

    if (elseRegex.test(trimmed)) {
      if (currentCondition) {
        currentCondition = { ...currentCondition, isElse: true };
      }
      continue;
    }

    if (endIfRegex.test(trimmed)) {
      currentCondition = null;
      continue;
    }

    if (setRegex.test(trimmed)) {
      const match = trimmed.match(setRegex);
      if (currentCondition) {
        console.warn(`logicParser: <<set $${match[1]}>> encontrado dentro de um bloco <<if>> — a condição não é preservada na estrutura de dados.`);
      }
      result.setters.push({
        variable: match[1],
        value: match[2].trim()
      });
      continue;
    }

    // --- Links / Escolhas ---
    let choiceText = null;
    let choiceTarget = null;

    if (linkRegexPipe.test(trimmed)) {
      const m = trimmed.match(linkRegexPipe);
      choiceText = m[1].trim();
      choiceTarget = m[2].trim();
    } else if (linkRegexArrow.test(trimmed)) {
      const m = trimmed.match(linkRegexArrow);
      choiceText = m[1].trim();
      choiceTarget = m[2].trim();
    } else if (linkRegexBack.test(trimmed)) {
      // [[Destino<-Texto]]: destino é o grupo 1, texto é o grupo 2
      const m = trimmed.match(linkRegexBack);
      choiceTarget = m[1].trim();
      choiceText = m[2].trim();
    } else if (linkRegexSimpl.test(trimmed)) {
      const m = trimmed.match(linkRegexSimpl);
      choiceText = m[1].trim();
      choiceTarget = m[1].trim();
    }

    if (choiceText !== null) {
      result.choices.push({
        text: choiceText,
        target: choiceTarget,
        condition: currentCondition ? { ...currentCondition } : null,
        order: choiceOrder++ // FIX #4: guardar ordem original
      });
      continue;
    }

    if (currentCondition) {
      console.warn(`logicParser: linha de texto encontrada dentro de um bloco <<if>> e ignorada na narrativa: "${trimmed}"`);
      continue;
    }

    // Tudo o resto é narrativa
    narrativeLines.push(line);
  }

  result.narrative = narrativeLines.join('\n').trim();
  return result;
}

// serializar a estrutura de dados de volta para texto
export function serializeLogicToText(logic) {
  const parts = [];

  // 1. texto narrativo
  if (logic.narrative) {
    parts.push(logic.narrative);
    parts.push(''); // spacing
  }

  // 2.  setters
  if (logic.setters && logic.setters.length > 0) {
    logic.setters.forEach(s => {
      if (s.variable.trim()) {
        parts.push(`<<set $${s.variable.trim()} to ${s.value}>>`);
      }
    });
    parts.push('');
  }

  // 3. escolhas, agrupando por condição
  const simpleChoices = [];
  const conditionalGroups = {};

  logic.choices.forEach(c => {
    if (!c.condition) {
      simpleChoices.push(c);
    } else {
      const condKey = `${c.condition.variable}_${c.condition.operator}_${c.condition.value}`;
      if (!conditionalGroups[condKey]) {
        conditionalGroups[condKey] = {
          ifCond: { variable: c.condition.variable, operator: c.condition.operator, value: c.condition.value },
          ifChoices: [],
          elseChoices: [],
          minOrder: c.order ?? Infinity
        };
      }

      // Atualizar a ordem mínima do grupo condicional
      if ((c.order ?? Infinity) < conditionalGroups[condKey].minOrder) {
        conditionalGroups[condKey].minOrder = c.order ?? Infinity;
      }
      if (c.condition.isElse) {
        conditionalGroups[condKey].elseChoices.push(c);
      } else {
        conditionalGroups[condKey].ifChoices.push(c);
      }
    }
  });

  // Construir lista de "blocos" a escrever, com ordem preservada
  const blocks = [];

  simpleChoices.forEach(c => {
    blocks.push({ order: c.order ?? 0, lines: [`[[${c.text}|${c.target}]]`] });
  });

  Object.values(conditionalGroups).forEach(group => {
    const lines = [];
    lines.push(`<<if $${group.ifCond.variable} ${group.ifCond.operator} ${group.ifCond.value}>>`);
    group.ifChoices.forEach(c => lines.push(`[[${c.text}|${c.target}]]`));
    if (group.elseChoices.length > 0) {
      lines.push(`<<else>>`);
      group.elseChoices.forEach(c => lines.push(`[[${c.text}|${c.target}]]`));
    }
    lines.push(`<</if>>`);
    blocks.push({ order: group.minOrder, lines });
  });

  // Ordenar todos os blocos pela sua posição original no texto
  blocks.sort((a, b) => a.order - b.order);
  blocks.forEach(b => b.lines.forEach(l => parts.push(l)));

  return parts.join('\n').trim();
}
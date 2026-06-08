// Helper to parse SugarCube variables, links, and if/else conditions from text
export function parseLogicFromText(text = '') {
  const result = {
    narrative: '',
    setters: [], // array of { variable, value }
    choices: [] // array of { text, target, condition: null | { variable, operator, value, isElse } }
  };

  const lines = text.split('\n');
  const narrativeLines = [];

  // Match <<set $var to val>> or <<set $var = val>>
  const setRegex = /<<set\s+\$([\w\d]+)\s*(?:to|=)\s*(.*?)>>/i;
  
  // Match link syntax [[Text|Target]] or [[Target]]
  const linkRegex = /\[\[(.*?)(?:\||->)(.*?)\]\]|\[\[(.*?)\]\]/;

  // Check if we are inside an if block
  const ifRegex = /<<if\s+\$([\w\d]+)\s*(is|isnot|gt|gte|lt|lte|==|!=|>|>=|<|<=)\s*(.*?)>>/i;
  const elseRegex = /<<else>>/i;
  const endIfRegex = /<<\/if>>/i;

  let currentCondition = null;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      // Keep empty line in narrative if it's just text
      if (narrativeLines.length > 0 && !currentCondition) {
        narrativeLines.push('');
      }
      continue;
    }

    // Check IF block
    if (ifRegex.test(trimmed)) {
      const match = trimmed.match(ifRegex);
      currentCondition = {
        variable: match[1],
        operator: match[2],
        value: match[3].replace(/>>$/, '').trim(),
        isElse: false
      };
      continue;
    }

    if (elseRegex.test(trimmed)) {
      if (currentCondition) {
        currentCondition = {
          ...currentCondition,
          isElse: true
        };
      }
      continue;
    }

    if (endIfRegex.test(trimmed)) {
      currentCondition = null;
      continue;
    }

    // Check SET block
    if (setRegex.test(trimmed)) {
      const match = trimmed.match(setRegex);
      result.setters.push({
        variable: match[1],
        value: match[2].replace(/>>$/, '').trim()
      });
      continue;
    }

    // Check Link/Choice
    if (linkRegex.test(trimmed)) {
      const match = trimmed.match(linkRegex);
      const rawText = (match[1] !== undefined ? match[1] : match[3]) || '';
      const target = (match[2] !== undefined ? match[2] : (match[3] || '')).trim();
      const choiceText = rawText.trim();
      
      result.choices.push({
        text: choiceText,
        target: target,
        condition: currentCondition ? { ...currentCondition } : null
      });
      continue;
    }

    // If it's none of the above, it's narrative text
    narrativeLines.push(line);
  }

  result.narrative = narrativeLines.join('\n').trim();
  return result;
}

// Convert structured logic back into SugarCube text
export function serializeLogicToText(logic) {
  const parts = [];

  // 1. Narrative text
  if (logic.narrative) {
    parts.push(logic.narrative);
    parts.push(''); // spacing
  }

  // 2. Setters (Variables modified on entering scene)
  if (logic.setters && logic.setters.length > 0) {
    logic.setters.forEach(s => {
      if (s.variable.trim()) {
        parts.push(`<<set $${s.variable.trim()} to ${s.value}>>`);
      }
    });
    parts.push(''); // spacing
  }

  // 3. Choices (Simple and Conditional)
  const simpleChoices = [];
  const conditionalGroups = {}; // group choices by condition string to output single <<if>> block

  logic.choices.forEach(c => {
    if (!c.condition) {
      simpleChoices.push(c);
    } else {
      const condKey = `${c.condition.variable}_${c.condition.operator}_${c.condition.value}`;
      if (!conditionalGroups[condKey]) {
        conditionalGroups[condKey] = {
          ifCond: { variable: c.condition.variable, operator: c.condition.operator, value: c.condition.value },
          ifChoices: [],
          elseChoices: []
        };
      }
      if (c.condition.isElse) {
        conditionalGroups[condKey].elseChoices.push(c);
      } else {
        conditionalGroups[condKey].ifChoices.push(c);
      }
    }
  });

  // Write out conditional choice blocks
  Object.values(conditionalGroups).forEach(group => {
    parts.push(`<<if $${group.ifCond.variable} ${group.ifCond.operator} ${group.ifCond.value}>>`);
    group.ifChoices.forEach(c => {
      parts.push(`[[${c.text}|${c.target}]]`);
    });
    if (group.elseChoices.length > 0) {
      parts.push(`<<else>>`);
      group.elseChoices.forEach(c => {
        parts.push(`[[${c.text}|${c.target}]]`);
      });
    }
    parts.push(`<</if>>`);
  });

  // Write out simple links
  simpleChoices.forEach(c => {
    parts.push(`[[${c.text}|${c.target}]]`);
  });

  return parts.join('\n').trim();
}

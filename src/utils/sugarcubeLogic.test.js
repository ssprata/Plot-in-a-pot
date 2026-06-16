import {
  applyModifiers,
  canAccessChoice,
  findStartNode,
  isSystemNode
} from './sugarcubeLogic';

describe('sugarcubeLogic utilities', () => {
  describe('applyModifiers', () => {
    test('applies simple value assignments', () => {
      const state = {};
      const result = applyModifiers('<<set $moedas to 100>>', state);
      expect(result.moedas).toBe(100);
    });

    test('applies logic expressions and assignments', () => {
      const state = { moedas: 10 };
      const result = applyModifiers('<<set $moedas = $moedas + 15>>', state);
      expect(result.moedas).toBe(25);
    });

    test('ignores complex, invalid expressions safely', () => {
      const state = { val: 5 };
      const result = applyModifiers('<<set $val to require("fs")>>', state);
      expect(result.val).toBe(5); // unchanged due to safety check block
    });

    test('supports string assignments', () => {
      const state = {};
      const result = applyModifiers('<<set $jogador to "Aventureiro">>', state);
      expect(result.jogador).toBe('Aventureiro');
    });
  });

  describe('canAccessChoice', () => {
    test('allows access to choice outside of conditional blocks', () => {
      const content = 'Vais para a floresta.\n[[Avançar|Floresta]]';
      expect(canAccessChoice(content, 'Avançar', {})).toBe(true);
    });

    test('blocks access when condition is false', () => {
      const content = '<<if $temChave is true>>[[Abrir Portão|Castelo]]<</if>>';
      expect(canAccessChoice(content, 'Abrir Portão', { temChave: false })).toBe(false);
      expect(canAccessChoice(content, 'Abrir Portão', {})).toBe(false);
    });

    test('allows access when condition is true', () => {
      const content = '<<if $temChave is true>>[[Abrir Portão|Castelo]]<</if>>';
      expect(canAccessChoice(content, 'Abrir Portão', { temChave: true })).toBe(true);
    });

    test('evaluates elseif branches correctly', () => {
      const content = `
        <<if $nivel gte 10>>
          [[Atacar Dragão|CombateDragao]]
        <<elseif $nivel gte 5>>
          [[Atacar Goblin|CombateGoblin]]
        <<else>>
          [[Fugir|Fuga]]
        <</if>>
      `;
      expect(canAccessChoice(content, 'Atacar Dragão', { nivel: 12 })).toBe(true);
      expect(canAccessChoice(content, 'Atacar Goblin', { nivel: 12 })).toBe(false);

      expect(canAccessChoice(content, 'Atacar Dragão', { nivel: 6 })).toBe(false);
      expect(canAccessChoice(content, 'Atacar Goblin', { nivel: 6 })).toBe(true);

      expect(canAccessChoice(content, 'Atacar Goblin', { nivel: 2 })).toBe(false);
      expect(canAccessChoice(content, 'Fugir', { nivel: 2 })).toBe(true);
    });
  });

  describe('findStartNode', () => {
    test('finds node by start tag', () => {
      const nodes = [
        { id: '1', data: { label: 'Outro', tags: '' } },
        { id: '2', data: { label: 'Inicio', tags: 'start, secreto' } }
      ];
      expect(findStartNode(nodes).id).toBe('2');
    });

    test('falls back to storydata start label', () => {
      const nodes = [
        { id: 'sd', data: { label: 'StoryData', content: '{"start": "PassagemInicial"}' } },
        { id: '1', data: { label: 'Outro', tags: '' } },
        { id: '2', data: { label: 'PassagemInicial', tags: '' } }
      ];
      expect(findStartNode(nodes).id).toBe('2');
    });

    test('falls back to node named Start', () => {
      const nodes = [
        { id: '1', data: { label: 'Outro', tags: '' } },
        { id: '2', data: { label: 'Start', tags: '' } }
      ];
      expect(findStartNode(nodes).id).toBe('2');
    });
  });

  describe('isSystemNode', () => {
    test('identifies core system names', () => {
      expect(isSystemNode({ data: { label: 'StoryInit', tags: '' } })).toBe(true);
      expect(isSystemNode({ data: { label: 'StoryData', tags: '' } })).toBe(true);
      expect(isSystemNode({ data: { label: 'RegularNode', tags: 'secreto' } })).toBe(true);
      expect(isSystemNode({ data: { label: 'RegularNode', tags: 'outro' } })).toBe(false);
    });

    test('identifies code and style types as system nodes', () => {
      expect(isSystemNode({ type: 'javascript', data: { label: 'ScriptNode', tags: '' } })).toBe(true);
      expect(isSystemNode({ type: 'css', data: { label: 'CssNode', tags: '' } })).toBe(true);
      expect(isSystemNode({ data: { nodeType: 'javascript', label: 'ScriptNode', tags: '' } })).toBe(true);
    });
  });
});

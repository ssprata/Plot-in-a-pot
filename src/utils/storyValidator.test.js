import { validateStoryFlow } from './storyValidator';

describe('storyValidator flow checks', () => {
  const cleanNodes = [
    {
      id: '1',
      type: 'choice',
      data: { label: 'Start', nodeType: 'choice', content: 'Início.\n[[Avançar|Passo2]]', tags: 'start' }
    },
    {
      id: '2',
      type: 'choice',
      data: { label: 'Passo2', nodeType: 'choice', content: 'Fim narrativo.', tags: '' }
    }
  ];

  const cleanEdges = [
    { id: 'e-1-2', source: '1', sourceHandle: 'c-1-Passo2-0', target: '2' }
  ];

  // We mock the node choices structure as parsed in tweeParser
  const cleanNodesWithChoices = cleanNodes.map(n => {
    if (n.id === '1') {
      return {
        ...n,
        data: {
          ...n.data,
          choices: [{ id: 'c-1-Passo2-0', text: 'Avançar', target: '2' }]
        }
      };
    }
    return { ...n, data: { ...n.data, choices: [] } };
  });

  test('validates a correct simple flow', () => {
    const result = validateStoryFlow(cleanNodesWithChoices, cleanEdges);

    expect(result.error).toBeNull();
    expect(result.unreachableEdges).toHaveLength(0);
    expect(result.orphanNodes).toHaveLength(0);
    expect(result.hasReachableEnd).toBe(true);
    expect(result.reachableEndNodes).toHaveLength(1);
    expect(result.reachableEndNodes[0].label).toBe('Passo2');
  });

  test('detects orphan (unreachable) nodes in the story', () => {
    const orphanNode = {
      id: '3',
      type: 'choice',
      data: { label: 'Orfao', nodeType: 'choice', content: 'Inalcançável.', tags: '', choices: [] }
    };
    const nodes = [...cleanNodesWithChoices, orphanNode];

    const result = validateStoryFlow(nodes, cleanEdges);

    expect(result.orphanNodes).toHaveLength(1);
    expect(result.orphanNodes[0].label).toBe('Orfao');
  });

  test('detects dead-end nodes with links pointing to non-existent nodes', () => {
    const brokenNodes = [
      {
        id: '1',
        type: 'choice',
        data: {
          label: 'Start',
          nodeType: 'choice',
          content: 'Link partido.\n[[Ir para o nada|Inexistente]]',
          tags: 'start',
          choices: [{ id: 'c-1-Inexistente-0', text: 'Ir para o nada', target: 'non-existent-id' }]
        }
      }
    ];
    const brokenEdges = [
      { id: 'e-1-none', source: '1', sourceHandle: 'c-1-Inexistente-0', target: 'non-existent-id' }
    ];

    const result = validateStoryFlow(brokenNodes, brokenEdges);

    expect(result.deadEndNodes).toHaveLength(1);
    expect(result.deadEndNodes[0].label).toBe('Start');
    expect(result.hasReachableEnd).toBe(true);
  });

  test('detects conditional branch logical blocks in traversal', () => {
    const conditionalNodes = [
      {
        id: '1',
        type: 'choice',
        data: {
          label: 'Start',
          nodeType: 'choice',
          content: '<<set $ouro to 10>>\n<<if $ouro gte 50>>[[Comprar|Loja]]<</if>>',
          tags: 'start',
          choices: [{ id: 'c-1-Loja-0', text: 'Comprar', target: '2' }]
        }
      },
      {
        id: '2',
        type: 'choice',
        data: { label: 'Loja', nodeType: 'choice', content: 'Entraste na loja.', tags: '', choices: [] }
      }
    ];

    const conditionalEdges = [
      { id: 'e-1-2', source: '1', sourceHandle: 'c-1-Loja-0', target: '2' }
    ];

    const result = validateStoryFlow(conditionalNodes, conditionalEdges);

    // Ouro = 10, so condition '$ouro gte 50' is false.
    // The edge e-1-2 should be unreachable due to conditions not met.
    expect(result.unreachableEdges).toHaveLength(1);
    expect(result.unreachableEdges[0].reason).toBe('condition_never_met');
    expect(result.unreachableEdges[0].targetLabel).toBe('Loja');
  });
});

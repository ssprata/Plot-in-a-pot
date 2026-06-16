import { parseTwee3, exportToTwee3, escapeForTweeHeader, escapeForTweeText } from './tweeParser';

describe('tweeParser utilities', () => {
  describe('parseTwee3', () => {
    test('parses simple twee content into nodes and edges', () => {
      const tweeContent = `
:: Start {"position":"250,100"}
Bem-vindo à taverna.
[[Falar com o taverneiro|Taverneiro]]
[[Sair para a rua|Rua]]

:: Taverneiro {"position":"100,300"}
O taverneiro pisca-te o olho.
[[Sair para a rua|Rua]]

:: Rua {"position":"400,300"}
A rua está deserta.
      `.trim();

      const { nodes, edges, warnings } = parseTwee3(tweeContent);

      expect(warnings).toHaveLength(0);
      expect(nodes).toHaveLength(3);
      expect(edges).toHaveLength(3);

      // Verify Start Node details
      const startNode = nodes.find(n => n.data.label === 'Start');
      expect(startNode).toBeDefined();
      expect(startNode.position).toEqual({ x: 250, y: 100 });
      expect(startNode.data.choices).toHaveLength(2);
      expect(startNode.data.choices[0].text).toBe('Falar com o taverneiro');

      // Verify connection edges match
      const taverneiroNode = nodes.find(n => n.data.label === 'Taverneiro');
      const ruaNode = nodes.find(n => n.data.label === 'Rua');
      
      const startToTaverneiro = edges.find(
        e => e.source === startNode.id && e.target === taverneiroNode.id
      );
      expect(startToTaverneiro).toBeDefined();
    });

    test('parses nodes type tags correctly', () => {
      const tweeContent = `
:: MyScript [script] {"position":"0,0"}
console.log("script init");

:: MyStyle [stylesheet] {"position":"0,0"}
body { color: black; }
      `.trim();

      const { nodes } = parseTwee3(tweeContent);
      const scriptNode = nodes.find(n => n.data.label === 'MyScript');
      const styleNode = nodes.find(n => n.data.label === 'MyStyle');

      expect(scriptNode.data.nodeType).toBe('javascript');
      expect(styleNode.data.nodeType).toBe('css');
    });

    test('resolves relative coordinates for parent-child relationship group zones', () => {
      const tweeContent = `
:: MyZone [zone] {"position":"100,100","size":"400,400"}
Conteúdo da zona.

:: ChildNode {"position":"150,250","parent":"MyZone"}
Sou filho da zona.
      `.trim();

      const { nodes } = parseTwee3(tweeContent);
      const zoneNode = nodes.find(n => n.data.label === 'MyZone');
      const childNode = nodes.find(n => n.data.label === 'ChildNode');

      expect(childNode.parentId).toBe(zoneNode.id);
      expect(childNode.extent).toBe('parent');
      // Relative positioning: absolute (150, 250) - parent absolute (100, 100) = (50, 150)
      expect(childNode.position).toEqual({ x: 50, y: 150 });
    });
  });

  describe('exportToTwee3', () => {
    test('exports nodes and edges back to valid twee string', () => {
      const nodes = [
        {
          id: '1',
          type: 'choice',
          position: { x: 250, y: 100 },
          data: { label: 'Start', nodeType: 'choice', content: 'Início.\n[[Destino]]', tags: ['tag1'] }
        },
        {
          id: '2',
          type: 'choice',
          position: { x: 400, y: 200 },
          data: { label: 'Destino', nodeType: 'choice', content: 'Fim.', tags: [] }
        }
      ];

      const exported = exportToTwee3(nodes, []);
      expect(exported).toContain(':: Start [tag1] {"position":"250,100"}');
      expect(exported).toContain('Início.\n[[Destino]]');
      expect(exported).toContain(':: Destino {"position":"400,200"}');
    });

    test('reverts relative positions back to absolute coordinates during export', () => {
      const nodes = [
        {
          id: 'zone-1',
          type: 'zone',
          position: { x: 100, y: 100 },
          data: { label: 'MyZone', nodeType: 'zone', content: '', tags: ['zone'], size: { width: 300, height: 200 } }
        },
        {
          id: 'child-1',
          type: 'choice',
          parentId: 'zone-1',
          position: { x: 50, y: 50 }, // Relative position
          data: { label: 'ChildNode', nodeType: 'choice', content: 'Filho.', tags: [] }
        }
      ];

      const exported = exportToTwee3(nodes, []);
      // Relative (50,50) + parent absolute (100,100) = absolute (150,150)
      expect(exported).toContain(':: ChildNode {"position":"150,150","parent":"MyZone"}');
    });
  });
});

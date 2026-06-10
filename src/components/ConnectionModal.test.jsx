import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConnectionModal from './ConnectionModal';

describe('ConnectionModal', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();
  const mockParams = {
    source: 'node-source',
    target: 'node-target',
  };

  const defaultNodes = [
    { id: 'node-source', data: { label: 'Source Node', tags: 'start' } },
    { id: 'node-target', data: { label: 'Target Node', tags: '' } },
    { id: 'node-a', data: { label: 'Node A', tags: 'A' } },
    { id: 'node-b', data: { label: 'Node B', tags: 'B, A' } }, // Node with multiple tags
    { id: 'node-secret', data: { label: 'Node Secret', tags: 'secreto' } }, // Node with only system tags
  ];

  const defaultGlobalVars = {
    player_hp: '100',
    player_gold: '50',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('does not render if isOpen is false', () => {
    const { container } = render(
      <ConnectionModal
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        params={mockParams}
        nodes={defaultNodes}
        globalVars={defaultGlobalVars}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('groups nodes by tags correctly without duplicates and filters out secret/start', () => {
    render(
      <ConnectionModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        params={mockParams}
        nodes={defaultNodes}
        globalVars={defaultGlobalVars}
      />
    );

    // Switch to conditional mode so we can see the dropdowns
    const condBtn = screen.getByText('Condicional ⚡');
    fireEvent.click(condBtn);

    // Get the first NodeSelect dropdown (If true target)
    const selects = screen.getAllByRole('combobox');
    // selects[0] is variable select, selects[1] is operator select, selects[2] is NodeSelect (if target)
    const nodeSelect = selects[2];

    // Find the optgroups
    const optgroups = nodeSelect.querySelectorAll('optgroup');
    const labels = Array.from(optgroups).map(og => og.getAttribute('label'));

    // Expected groups:
    // - "# Sem tag": Contains node-target (no tags) and node-secret (secreto is filtered out, making tags empty)
    // - "# A": Contains node-a (has tag A)
    // - "# B": Contains node-b (has tags "B, A", but since B is first, it's grouped under B and seen is set, so it won't duplicate under A)
    // - Note that node-source is excluded entirely because it is the source node of the connection.
    expect(labels).toContain('# Sem tag');
    expect(labels).toContain('# A');
    expect(labels).toContain('# B');
    expect(labels).not.toContain('# secreto');
    expect(labels).not.toContain('# start');

    // Verify Sem tag contents
    const semTagGroup = Array.from(optgroups).find(og => og.getAttribute('label') === '# Sem tag');
    const semTagOptions = Array.from(semTagGroup.querySelectorAll('option')).map(opt => opt.value);
    expect(semTagOptions).toContain('node-target');
    expect(semTagOptions).toContain('node-secret');

    // Verify B contents (node-b) and check that node-b is NOT in group A
    const groupB = Array.from(optgroups).find(og => og.getAttribute('label') === '# B');
    const optionsB = Array.from(groupB.querySelectorAll('option')).map(opt => opt.value);
    expect(optionsB).toContain('node-b');

    const groupA = Array.from(optgroups).find(og => og.getAttribute('label') === '# A');
    const optionsA = Array.from(groupA.querySelectorAll('option')).map(opt => opt.value);
    expect(optionsA).toContain('node-a');
    expect(optionsA).not.toContain('node-b'); // No duplicate placement
  });

  test('resets state when modal opens and uses current varNames', () => {
    // Render initially closed
    const { rerender } = render(
      <ConnectionModal
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        params={mockParams}
        nodes={defaultNodes}
        globalVars={defaultGlobalVars}
      />
    );

    // Open modal with globalVars
    rerender(
      <ConnectionModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        params={mockParams}
        nodes={defaultNodes}
        globalVars={defaultGlobalVars}
      />
    );

    // Switch to conditional mode using freshly queried button
    const condBtn = screen.getByText('Condicional ⚡');
    fireEvent.click(condBtn);

    // Find the variable select using its placeholder option
    const selects = screen.getAllByRole('combobox');
    const varSelect = selects.find(select => 
      Array.from(select.options).some(opt => opt.text === '$variável')
    );
    expect(varSelect.value).toBe('player_hp');

    // Close and open again with different globalVars to test dependency reset
    rerender(
      <ConnectionModal
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        params={mockParams}
        nodes={defaultNodes}
        globalVars={{ player_mana: '80' }}
      />
    );

    rerender(
      <ConnectionModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        params={mockParams}
        nodes={defaultNodes}
        globalVars={{ player_mana: '80' }}
      />
    );

    // Query elements again since modal was reopened (unmounted & remounted)
    const condBtnNew = screen.getByText('Condicional ⚡');
    fireEvent.click(condBtnNew);

    const selectsNew = screen.getAllByRole('combobox');
    const varSelectNew = selectsNew.find(select => 
      Array.from(select.options).some(opt => opt.text === '$variável')
    );
    expect(varSelectNew.value).toBe('player_mana');
  });

  test('renders conditional preview correctly when target nodes are resolved', () => {
    render(
      <ConnectionModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        params={mockParams}
        nodes={defaultNodes}
        globalVars={defaultGlobalVars}
      />
    );

    // Switch to conditional mode
    const condBtn = screen.getByText('Condicional ⚡');
    fireEvent.click(condBtn);

    // Function to get fresh select elements from DOM
    const getSelect = (placeholderText, optValToCheck = null) => {
      const selects = screen.getAllByRole('combobox');
      if (optValToCheck) {
        return selects.find(select => 
          Array.from(select.options).some(opt => opt.value === optValToCheck)
        );
      }
      return selects.find(select => 
        Array.from(select.options).some(opt => opt.text === placeholderText)
      );
    };

    fireEvent.change(getSelect('$variável'), { target: { value: 'player_hp' } });
    fireEvent.change(getSelect(null, 'is'), { target: { value: 'lt' } });
    
    const valueInput = screen.getByPlaceholderText('valor');
    fireEvent.change(valueInput, { target: { value: '30' } });

    // Select ifTarget = node-a (fetched freshly)
    const freshIfNodeSelect = getSelect('Seleciona o nó de destino...');
    fireEvent.change(freshIfNodeSelect, { target: { value: 'node-a' } });

    // Preview should show "<<if $player_hp lt 30>>" and "[[Node A|Node A]]"
    expect(screen.getByText('<<if $player_hp lt 30>>')).toBeInTheDocument();
    expect(screen.getByText('[[Node A|Node A]]')).toBeInTheDocument();

    // Select elseTarget = node-b (fetched freshly)
    const freshElseNodeSelect = getSelect('Sem else (nó termina aqui)');
    fireEvent.change(freshElseNodeSelect, { target: { value: 'node-b' } });

    // Preview should now also show "<<else>>" and "[[Node B|Node B]]"
    expect(screen.getByText('<<else>>')).toBeInTheDocument();
    expect(screen.getByText('[[Node B|Node B]]')).toBeInTheDocument();
    expect(screen.getByText('<</if>>')).toBeInTheDocument();

    // Confirm connection triggers callback with correct data
    const confirmBtn = screen.getByText('Confirmar Ligação');
    fireEvent.click(confirmBtn);

    expect(mockOnConfirm).toHaveBeenCalledWith({
      type: 'conditional',
      choiceText: '',
      params: mockParams,
      ifVariable: 'player_hp',
      ifOperator: 'lt',
      ifValue: '30',
      ifTargetNodeId: 'node-a',
      elseTargetNodeId: 'node-b',
    });
  });
});

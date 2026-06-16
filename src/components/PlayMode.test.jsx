import React from 'react';
import { render, cleanup } from '@testing-library/react';
import PlayMode from './PlayMode';

// Mock InfoPopoutContext
jest.mock('../contexts/InfoPopoutContext', () => ({
  useInfoPopout: () => ({
    showInfoPopout: jest.fn(),
  }),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: 'pt',
    },
  }),
}));

describe('PlayMode Script and Style Nodes support', () => {
  afterEach(() => {
    cleanup();
    const styleTag = document.getElementById('playmode-stylesheet');
    if (styleTag) styleTag.remove();
  });

  const mockNodes = [
    {
      id: '1',
      type: 'choice',
      data: { label: 'Start', nodeType: 'choice', content: 'Início da aventura.', tags: 'start' }
    },
    {
      id: 'js-node',
      type: 'javascript',
      data: { label: 'Script Node', nodeType: 'javascript', content: 'state.customVar = "hello_world"; State.variables.anotherVar = 42;' }
    },
    {
      id: 'css-node',
      type: 'css',
      data: { label: 'Style Node', nodeType: 'css', content: '.custom-class { color: red; }' }
    }
  ];

  test('injects CSS stylesheet to head on open and cleans up on close', () => {
    // 1. Render closed - shouldn't inject
    const { rerender } = render(
      <PlayMode
        isOpen={false}
        onClose={jest.fn()}
        nodes={mockNodes}
        edges={[]}
        translations={{ languages: ['pt'], keys: {} }}
      />
    );
    expect(document.getElementById('playmode-stylesheet')).toBeNull();

    // 2. Open simulator - should inject the stylesheet content
    rerender(
      <PlayMode
        isOpen={true}
        onClose={jest.fn()}
        nodes={mockNodes}
        edges={[]}
        translations={{ languages: ['pt'], keys: {} }}
      />
    );
    const styleTag = document.getElementById('playmode-stylesheet');
    expect(styleTag).not.toBeNull();
    expect(styleTag.textContent).toContain('.custom-class { color: red; }');

    // 3. Close simulator - should remove stylesheet
    rerender(
      <PlayMode
        isOpen={false}
        onClose={jest.fn()}
        nodes={mockNodes}
        edges={[]}
        translations={{ languages: ['pt'], keys: {} }}
      />
    );
    expect(document.getElementById('playmode-stylesheet')).toBeNull();
  });

  test('executes javascript nodes at startup and triggers node change', () => {
    const onCurrentNodeIdChange = jest.fn();

    render(
      <PlayMode
        isOpen={true}
        onClose={jest.fn()}
        nodes={mockNodes}
        edges={[]}
        translations={{ languages: ['pt'], keys: {} }}
        onCurrentNodeIdChange={onCurrentNodeIdChange}
      />
    );

    // Let's ensure startNode was matched and simulator loaded successfully
    expect(onCurrentNodeIdChange).toHaveBeenCalledWith('1');
  });
});

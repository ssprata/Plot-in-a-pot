import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AiImportModal from './AiImportModal';
import { generateFromGemini, generateFromOllama } from '../utils/aiGenerator';
import { useInfoPopout } from '../contexts/InfoPopoutContext';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('../contexts/InfoPopoutContext', () => ({
  useInfoPopout: jest.fn(),
}));

jest.mock('../utils/aiGenerator', () => ({
  generateFromGemini: jest.fn(),
  generateFromOllama: jest.fn(),
}));

describe('AiImportModal', () => {
  const mockOnClose = jest.fn();
  const mockOnImportSuccess = jest.fn();
  const mockShowInfoPopout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    useInfoPopout.mockReturnValue({
      showInfoPopout: mockShowInfoPopout,
    });
  });

  test('does not render if isOpen is false', () => {
    const { container } = render(
      <AiImportModal isOpen={false} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders correctly and initializes apiKey from localStorage', () => {
    localStorage.setItem('gemini-api-key', 'stored-key-123');
    render(
      <AiImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />
    );
    
    // Check that header is rendered
    expect(screen.getByText('aiImportModal.title')).toBeInTheDocument();
    
    // Check that apiKey input is initialized with stored-key-123
    const apiKeyInput = screen.getByPlaceholderText('AIzaSy...');
    expect(apiKeyInput.value).toBe('stored-key-123');
  });

  test('saves apiKey to localStorage on change (Rules of Hooks verification)', () => {
    render(
      <AiImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />
    );
    
    const apiKeyInput = screen.getByPlaceholderText('AIzaSy...');
    fireEvent.change(apiKeyInput, { target: { value: 'new-key-456' } });
    
    expect(localStorage.getItem('gemini-api-key')).toBe('new-key-456');
  });

  test('clears error when modal is closed (reopened)', async () => {
    const { rerender } = render(
      <AiImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />
    );
    
    // Trigger validation error by submitting empty form
    const generateBtn = screen.getByText('aiImportModal.generateGraph');
    fireEvent.click(generateBtn);
    
    // Error is displayed (no story input)
    expect(screen.getByText('aiImportModal.errors.noStory')).toBeInTheDocument();
    
    // Close modal (isOpen = false)
    rerender(
      <AiImportModal isOpen={false} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />
    );
    
    // Open modal again (isOpen = true)
    rerender(
      <AiImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />
    );
    
    // Error should be cleared
    expect(screen.queryByText('aiImportModal.errors.noStory')).not.toBeInTheDocument();
  });

  test('clears error when switching providers', () => {
    render(
      <AiImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />
    );
    
    // Select Gemini, submit with empty story -> error
    const generateBtn = screen.getByText('aiImportModal.generateGraph');
    fireEvent.click(generateBtn);
    expect(screen.getByText('aiImportModal.errors.noStory')).toBeInTheDocument();
    
    // Switch to Ollama provider
    const ollamaRadio = screen.getByLabelText('aiImportModal.ollama');
    fireEvent.click(ollamaRadio);
    
    // Error should be cleared
    expect(screen.queryByText('aiImportModal.errors.noStory')).not.toBeInTheDocument();
  });

  test('uses fallback translation for generic errors if error message is empty', async () => {
    generateFromGemini.mockRejectedValueOnce(new Error(''));
    
    render(
      <AiImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />
    );
    
    // Fill in API key and Story Text to pass validation
    const apiKeyInput = screen.getByPlaceholderText('AIzaSy...');
    fireEvent.change(apiKeyInput, { target: { value: 'some-key' } });
    
    const storyTextarea = screen.getByPlaceholderText('aiImportModal.storyPlaceholder');
    fireEvent.change(storyTextarea, { target: { value: 'Once upon a time...' } });
    
    // Click generate
    const generateBtn = screen.getByText('aiImportModal.generateGraph');
    fireEvent.click(generateBtn);
    
    // Wait for the async generate function to complete and show error
    await waitFor(() => {
      expect(screen.getByText('aiImportModal.errors.generic')).toBeInTheDocument();
    });
  });
});

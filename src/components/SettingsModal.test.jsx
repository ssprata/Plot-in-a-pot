import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsModal from './SettingsModal';
import { useTranslation } from 'react-i18next';

// Mock InfoPopoutContext
jest.mock('../contexts/InfoPopoutContext', () => ({
  useInfoPopout: () => ({
    showInfoPopout: jest.fn(),
  }),
}));

// Mock react-i18next
const mockChangeLanguage = jest.fn();
let mockLanguage = 'en';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      get language() {
        return mockLanguage;
      },
      changeLanguage: mockChangeLanguage,
      on: jest.fn(),
      off: jest.fn(),
    },
  }),
}));

describe('SettingsModal language switcher', () => {
  beforeEach(() => {
    mockChangeLanguage.mockClear();
    mockLanguage = 'en';
  });

  test('calls i18n.changeLanguage with "pt" when current language is "en"', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={jest.fn()}
        settings={{ showSecrets: false, showFlowErrors: false, showAdjacency: false, visualLogicEnabled: true }}
        toggleSetting={jest.fn()}
        updateSetting={jest.fn()}
        resetProject={jest.fn()}
      />
    );

    const button = screen.getByText('Português (PT)');
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockChangeLanguage).toHaveBeenCalledWith('pt');
  });

  test('calls i18n.changeLanguage with "en" when current language is "pt"', () => {
    mockLanguage = 'pt';
    render(
      <SettingsModal
        isOpen={true}
        onClose={jest.fn()}
        settings={{ showSecrets: false, showFlowErrors: false, showAdjacency: false, visualLogicEnabled: true }}
        toggleSetting={jest.fn()}
        updateSetting={jest.fn()}
        resetProject={jest.fn()}
      />
    );

    const button = screen.getByText('English (EN)');
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
  });
});

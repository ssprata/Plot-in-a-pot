import { render, screen } from '@testing-library/react';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import './i18n';

test('renders app and main node label', () => {
  render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
  const startNodeElement = screen.getByText(/Start/);
  expect(startNodeElement).toBeInTheDocument();
});

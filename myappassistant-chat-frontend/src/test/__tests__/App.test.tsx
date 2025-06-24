// ✅ REQUIRED: Main App component test
import { describe, it, expect } from 'vitest';
import { render, screen } from '../utils';
import App from '../../App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('Vite + React')).toBeInTheDocument();
  });

  it('displays counter button', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /count is 0/i })).toBeInTheDocument();
  });

  it('shows edit instructions', () => {
    render(<App />);
    expect(screen.getByText('Edit', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('and save to test HMR', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('src/App.tsx', { exact: false })).toBeInTheDocument();
  });

  it('has read the docs link', () => {
    render(<App />);
    expect(screen.getByText(/Click on the Vite and React logos to learn more/i)).toBeInTheDocument();
  });
}); 
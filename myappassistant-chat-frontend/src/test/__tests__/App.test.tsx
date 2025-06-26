import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../utils';
import App from '../../App';
import { ThemeProvider } from '../../components/ThemeProvider';
import { BrowserRouter } from 'react-router-dom';
import { act } from 'react';

vi.mock('../../pages/DashboardPage', () => ({
  default: () => <div>Dashboard Page</div>,
}));

describe('App', () => {
  const renderApp = () => {
    return render(
      <BrowserRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  it('renders without crashing', async () => {
    await act(async () => {
      renderApp();
    });
    expect(await screen.findByText('Dashboard Page')).toBeInTheDocument();
  });
}); 
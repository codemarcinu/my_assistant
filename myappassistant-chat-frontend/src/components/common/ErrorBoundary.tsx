"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Typography, Button, Paper } from '@mui/material';
import { Error, Refresh } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // You can also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI with translations
      return <ErrorBoundaryContent error={this.state.error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

// Separate functional component to use hooks for translations
function ErrorBoundaryContent({ error, onRetry }: { error?: Error; onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <Paper
      sx={{
        p: 3,
        m: 2,
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Error sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        {t('errors.general')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {error?.message || t('errors.unexpected')}
      </Typography>
      <Button
        variant="contained"
        startIcon={<Refresh />}
        onClick={onRetry}
        sx={{ mr: 1 }}
      >
        {t('buttons.try_again')}
      </Button>
      <Button
        variant="outlined"
        onClick={() => window.location.reload()}
      >
        {t('buttons.refresh_page')}
      </Button>
    </Paper>
  );
}

// Hook-based error boundary for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error('useErrorHandler caught an error:', error);
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
} 
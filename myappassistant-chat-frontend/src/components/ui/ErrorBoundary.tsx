import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from './atoms/Button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

class ErrorBoundaryClass extends React.Component<
  ErrorBoundaryProps & { t: (key: string) => string },
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps & { t: (key: string) => string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    const { t } = this.props;

    if (this.state.hasError) {
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error!} resetError={this.resetError} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {t('errors.unknownError')}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {this.state.error?.message || t('errors.serverError')}
              </p>
              <div className="mt-6">
                <Button onClick={this.resetError} variant="primary">
                  {t('common.retry')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to provide translation function
export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children, fallback }) => {
  const { t } = useTranslation();
  return (
    <ErrorBoundaryClass t={t} fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  );
};

// Specific error boundaries for different contexts
export const ChatErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();

  const ChatErrorFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex items-center">
        <svg
          className="w-5 h-5 text-red-400 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <span className="text-sm font-medium text-red-800 dark:text-red-200">
          {t('chat.messageError')}
        </span>
      </div>
      <p className="mt-1 text-sm text-red-600 dark:text-red-300">
        {error.message}
      </p>
      <Button onClick={resetError} variant="outline" size="sm" className="mt-2">
        {t('common.retry')}
      </Button>
    </div>
  );

  return (
    <ErrorBoundary fallback={ChatErrorFallback}>
      {children}
    </ErrorBoundary>
  );
};

export const UploadErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();

  const UploadErrorFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
      <div className="flex items-center">
        <svg
          className="w-5 h-5 text-yellow-400 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
          {t('receipts.uploadError')}
        </span>
      </div>
      <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-300">
        {error.message}
      </p>
      <Button onClick={resetError} variant="outline" size="sm" className="mt-2">
        {t('common.retry')}
      </Button>
    </div>
  );

  return (
    <ErrorBoundary fallback={UploadErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}; 
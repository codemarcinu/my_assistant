import React, { useCallback, useMemo } from 'react';
import { useTheme } from '../ThemeProvider';
import Button from './Button';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * ErrorFallback component for handling application errors with performance optimization.
 * 
 * This component provides a user-friendly error display with
 * recovery options, following the .cursorrules guidelines.
 */
const ErrorFallback: React.FC<ErrorFallbackProps> = React.memo(({ error, resetErrorBoundary }) => {
  const { resolvedTheme } = useTheme();

  // Memoizacja funkcji obsługi akcji
  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  const handleGoHome = useCallback(() => {
    window.location.href = '/dashboard';
  }, []);

  // Memoizacja klas CSS
  const containerClasses = useMemo(() => {
    const baseClasses = 'min-h-screen flex items-center justify-center p-4';
    const themeClasses = resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
    return `${baseClasses} ${themeClasses}`;
  }, [resolvedTheme]);

  const cardClasses = useMemo(() => {
    const baseClasses = 'max-w-md w-full p-8 rounded-xl shadow-lg';
    const themeClasses = resolvedTheme === 'dark' 
      ? 'bg-gray-800 border border-gray-700' 
      : 'bg-white border border-gray-200';
    return `${baseClasses} ${themeClasses}`;
  }, [resolvedTheme]);

  const iconClasses = useMemo(() => {
    const baseClasses = 'w-16 h-16 rounded-full flex items-center justify-center';
    const themeClasses = resolvedTheme === 'dark' 
      ? 'bg-red-900/20 text-red-400' 
      : 'bg-red-100 text-red-600';
    return `${baseClasses} ${themeClasses}`;
  }, [resolvedTheme]);

  const titleClasses = useMemo(() => {
    const baseClasses = 'text-xl font-bold mb-2';
    const themeClasses = resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900';
    return `${baseClasses} ${themeClasses}`;
  }, [resolvedTheme]);

  const descriptionClasses = useMemo(() => {
    const baseClasses = 'text-sm mb-4';
    const themeClasses = resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600';
    return `${baseClasses} ${themeClasses}`;
  }, [resolvedTheme]);

  const summaryClasses = useMemo(() => {
    const baseClasses = 'cursor-pointer text-xs font-medium mb-2';
    const themeClasses = resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600';
    return `${baseClasses} ${themeClasses}`;
  }, [resolvedTheme]);

  const preClasses = useMemo(() => {
    const baseClasses = 'text-xs p-3 rounded bg-gray-100 dark:bg-gray-700 overflow-auto max-h-32';
    const themeClasses = resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-800';
    return `${baseClasses} ${themeClasses}`;
  }, [resolvedTheme]);

  const contactClasses = useMemo(() => {
    const baseClasses = 'text-xs text-center';
    const themeClasses = resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-400';
    return `${baseClasses} ${themeClasses}`;
  }, [resolvedTheme]);

  return (
    <div className={containerClasses}>
      <div className={cardClasses}>
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className={iconClasses}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <div className="text-center mb-6">
          <h1 className={titleClasses}>
            Ups! Coś poszło nie tak
          </h1>
          <p className={descriptionClasses}>
            Wystąpił nieoczekiwany błąd w aplikacji. Spróbuj odświeżyć stronę lub wróć do strony głównej.
          </p>
          
          {/* Error Details (Development Only) */}
          {import.meta.env.DEV && (
            <details className="text-left">
              <summary className={summaryClasses}>
                Szczegóły błędu (tylko w trybie deweloperskim)
              </summary>
              <pre className={preClasses}>
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={resetErrorBoundary}
            className="flex-1"
            variant="primary"
          >
            Spróbuj ponownie
          </Button>
          <Button
            onClick={handleReload}
            className="flex-1"
            variant="outline"
          >
            Odśwież stronę
          </Button>
          <Button
            onClick={handleGoHome}
            className="flex-1"
            variant="ghost"
          >
            Strona główna
          </Button>
        </div>

        {/* Contact Info */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className={contactClasses}>
            Jeśli problem się powtarza, skontaktuj się z zespołem wsparcia.
          </p>
        </div>
      </div>
    </div>
  );
});

ErrorFallback.displayName = 'ErrorFallback';

export default ErrorFallback; 
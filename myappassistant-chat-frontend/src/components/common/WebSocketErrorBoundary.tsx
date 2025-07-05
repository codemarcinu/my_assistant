import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error Boundary dla komponentów WebSocket
 * Zapewnia graceful handling błędów WebSocket zgodnie z regułami projektu
 */
export class WebSocketErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Aktualizuje state, aby następny render pokazał fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[WebSocketErrorBoundary] Caught error:', error, errorInfo);
    
    // Logowanie błędu do systemu monitoringu
    this.logError(error, errorInfo);
    
    // Wywołanie callback jeśli podano
    this.props.onError?.(error, errorInfo);
  }

  private logError(error: Error, errorInfo: ErrorInfo) {
    // Logowanie do konsoli w trybie development
    if (process.env.NODE_ENV === 'development') {
      console.group('[WebSocketErrorBoundary] Error Details');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }

    // Tutaj można dodać logowanie do zewnętrznego systemu monitoringu
    // np. Sentry, LogRocket, etc.
    try {
      // Przykład logowania do localStorage dla debugowania
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      const existingLogs = JSON.parse(localStorage.getItem('websocket_errors') || '[]');
      existingLogs.push(errorLog);
      
      // Zachowaj tylko ostatnie 10 błędów
      if (existingLogs.length > 10) {
        existingLogs.splice(0, existingLogs.length - 10);
      }
      
      localStorage.setItem('websocket_errors', JSON.stringify(existingLogs));
    } catch (logError) {
      console.error('[WebSocketErrorBoundary] Failed to log error:', logError);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Domyślny fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center">
            <div className="text-red-600 text-2xl mb-2">⚠️</div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Błąd połączenia WebSocket
            </h3>
            <p className="text-red-700 mb-4 max-w-md">
              Wystąpił problem z połączeniem w czasie rzeczywistym. 
              Możesz spróbować ponownie lub odświeżyć stronę.
            </p>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Spróbuj ponownie
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Odśwież stronę
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                  Szczegóły błędu (tylko development)
                </summary>
                <div className="mt-2 p-3 bg-red-100 rounded text-xs font-mono text-red-800 overflow-auto max-h-40">
                  <div><strong>Error:</strong> {this.state.error.message}</div>
                  <div><strong>Stack:</strong></div>
                  <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                  {this.state.errorInfo && (
                    <>
                      <div><strong>Component Stack:</strong></div>
                      <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook do używania WebSocketErrorBoundary w komponentach funkcyjnych
 */
export const useWebSocketErrorHandler = () => {
  const handleWebSocketError = React.useCallback((error: Error, errorInfo: ErrorInfo) => {
    // Dodatkowa logika obsługi błędów WebSocket
    console.error('[useWebSocketErrorHandler] WebSocket error:', error);
    
    // Można tutaj dodać dodatkową logikę, np.:
    // - Powiadomienia użytkownika
    // - Automatyczne ponowne połączenie
    // - Logowanie do systemu monitoringu
  }, []);

  return { handleWebSocketError };
};

export default WebSocketErrorBoundary; 
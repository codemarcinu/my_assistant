import { useState, useEffect } from 'react';

export interface TauriContext {
  isAvailable: boolean;
  isInitialized: boolean;
  error?: string;
}

export const useTauriContext = (): TauriContext => {
  const [context, setContext] = useState<TauriContext>({
    isAvailable: false,
    isInitialized: false,
  });

  useEffect(() => {
    const checkTauriAvailability = () => {
      try {
        const isAvailable = typeof window !== 'undefined' && 
                           window.__TAURI__ !== undefined && 
                           typeof window.__TAURI__.invoke === 'function';
        
        setContext({
          isAvailable,
          isInitialized: true,
          error: isAvailable ? undefined : 'Tauri API not available in this context',
        });
      } catch (error) {
        setContext({
          isAvailable: false,
          isInitialized: true,
          error: `Failed to initialize Tauri context: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    };

    // Check immediately
    checkTauriAvailability();

    // Also check after a short delay to handle any async initialization
    const timeoutId = setTimeout(checkTauriAvailability, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  return context;
}; 
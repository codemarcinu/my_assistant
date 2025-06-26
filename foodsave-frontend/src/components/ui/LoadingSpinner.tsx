import React, { useMemo } from 'react';
import { useTheme } from '../ThemeProvider';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

/**
 * LoadingSpinner component for displaying loading states with performance optimization.
 * 
 * This component provides a consistent loading indicator with
 * customizable size and optional text, following the .cursorrules guidelines.
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = React.memo(({ 
  size = 'md', 
  text = 'Ładowanie...',
  className = '' 
}) => {
  const { resolvedTheme } = useTheme();

  // Memoizacja klas CSS dla lepszej wydajności
  const sizeClasses = useMemo(() => ({
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }), []);

  const textSizeClasses = useMemo(() => ({
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }), []);

  // Memoizacja stylów spinnera
  const spinnerClasses = useMemo(() => {
    const baseClasses = `${sizeClasses[size]} border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4`;
    const themeClasses = resolvedTheme === 'dark' ? 'border-gray-600 border-t-blue-400' : '';
    return `${baseClasses} ${themeClasses}`;
  }, [sizeClasses, size, resolvedTheme]);

  // Memoizacja klas tekstu
  const textClasses = useMemo(() => {
    return `${textSizeClasses[size]} text-gray-600 dark:text-gray-400 font-medium text-center`;
  }, [textSizeClasses, size]);

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className={spinnerClasses} />
      {text && (
        <p className={textClasses}>
          {text}
        </p>
      )}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner; 
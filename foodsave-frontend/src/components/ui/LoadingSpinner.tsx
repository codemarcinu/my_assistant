import React from 'react';
import { useTheme } from '../ThemeProvider';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

/**
 * LoadingSpinner component for displaying loading states.
 * 
 * This component provides a consistent loading indicator with
 * customizable size and optional text, following the .cursorrules guidelines.
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Ładowanie...',
  className = '' 
}) => {
  const { resolvedTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className={`
        ${sizeClasses[size]} border-2 border-gray-300 border-t-blue-600 
        rounded-full animate-spin mb-4
        ${resolvedTheme === 'dark' ? 'border-gray-600 border-t-blue-400' : ''}
      `} />
      {text && (
        <p className={`
          ${textSizeClasses[size]} text-gray-600 dark:text-gray-400
          font-medium text-center
        `}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner; 
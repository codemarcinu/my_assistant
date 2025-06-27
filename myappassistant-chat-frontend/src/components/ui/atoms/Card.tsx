import React from 'react';
import { useTheme } from '../../ThemeProvider';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
}

export default function Card({ 
  children, 
  className = '', 
  padding = 'md',
  shadow = 'md'
}: CardProps) {
  const { resolvedTheme } = useTheme();

  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  return (
    <div className={`
      rounded-xl border transition-all duration-200
      ${resolvedTheme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
      }
      ${paddingClasses[padding]}
      ${shadowClasses[shadow]}
      ${className}
    `}>
      {children}
    </div>
  );
} 
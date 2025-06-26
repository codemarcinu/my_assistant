import React, { useMemo } from 'react';
import { useTheme } from '../ThemeProvider';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = React.memo(({ 
  children, 
  className = '', 
  padding = 'md',
  shadow = 'md'
}) => {
  const { resolvedTheme } = useTheme();

  // Memoizacja klas CSS dla lepszej wydajności
  const cardClasses = useMemo(() => {
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

    const baseClasses = 'rounded-xl border transition-all duration-200';
    const themeClasses = resolvedTheme === 'dark' 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-white border-gray-200';

    return `${baseClasses} ${themeClasses} ${paddingClasses[padding]} ${shadowClasses[shadow]} ${className}`;
  }, [resolvedTheme, padding, shadow, className]);

  return (
    <div className={cardClasses}>
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card; 
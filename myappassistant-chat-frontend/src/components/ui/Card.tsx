import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'outlined' | 'filled';
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'elevated', interactive = false, selected = false, disabled = false, children, ...props }, ref) => {
    const baseClasses = cn(
      'rounded-xl transition-all duration-200 ease-in-out',
      'overflow-hidden',
      disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
    );

    const variantClasses = {
      elevated: cn(
        'bg-white dark:bg-gray-800',
        'shadow-sm hover:shadow-md',
        'border border-gray-200 dark:border-gray-700',
        interactive && 'cursor-pointer hover:shadow-lg active:shadow-sm',
        selected && 'ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg'
      ),
      outlined: cn(
        'bg-transparent',
        'border-2 border-gray-200 dark:border-gray-700',
        'hover:border-gray-300 dark:hover:border-gray-600',
        interactive && 'cursor-pointer',
        selected && 'border-blue-500 dark:border-blue-400'
      ),
      filled: cn(
        'bg-gray-50 dark:bg-gray-900',
        'border border-gray-200 dark:border-gray-700',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        interactive && 'cursor-pointer',
        selected && 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
      )
    };

    const classes = cn(baseClasses, variantClasses[variant], className);

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4 border-b border-gray-200 dark:border-gray-700', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, padding = 'md', ...props }, ref) => {
    const paddingClasses = {
      none: '',
      sm: 'px-4 py-3',
      md: 'px-6 py-4',
      lg: 'px-8 py-6'
    };

    return (
      <div
        ref={ref}
        className={cn(paddingClasses[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4 border-t border-gray-200 dark:border-gray-700', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter }; 
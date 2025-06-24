import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', rounded = false, children, ...props }, ref) => {
    const baseClasses = cn(
      'inline-flex items-center justify-center font-medium',
      'transition-all duration-200 ease-in-out',
      rounded ? 'rounded-full' : 'rounded-md'
    );

    const sizeClasses = {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-sm px-2.5 py-1',
      lg: 'text-base px-3 py-1.5'
    };

    const variantClasses = {
      default: cn(
        'bg-gray-100 dark:bg-gray-800',
        'text-gray-800 dark:text-gray-200',
        'border border-gray-200 dark:border-gray-700'
      ),
      primary: cn(
        'bg-blue-100 dark:bg-blue-900/30',
        'text-blue-800 dark:text-blue-200',
        'border border-blue-200 dark:border-blue-700'
      ),
      success: cn(
        'bg-green-100 dark:bg-green-900/30',
        'text-green-800 dark:text-green-200',
        'border border-green-200 dark:border-green-700'
      ),
      warning: cn(
        'bg-yellow-100 dark:bg-yellow-900/30',
        'text-yellow-800 dark:text-yellow-200',
        'border border-yellow-200 dark:border-yellow-700'
      ),
      error: cn(
        'bg-red-100 dark:bg-red-900/30',
        'text-red-800 dark:text-red-200',
        'border border-red-200 dark:border-red-700'
      ),
      info: cn(
        'bg-cyan-100 dark:bg-cyan-900/30',
        'text-cyan-800 dark:text-cyan-200',
        'border border-cyan-200 dark:border-cyan-700'
      )
    };

    const classes = cn(baseClasses, sizeClasses[size], variantClasses[variant], className);

    return (
      <span ref={ref} className={classes} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge }; 
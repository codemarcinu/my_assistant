import React from 'react';
import { cn } from '../../../utils/cn';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  label?: string;
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', variant = 'default', label = 'Loading...', ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
      xl: 'w-12 h-12'
    };

    const variantClasses = {
      default: 'text-gray-400 dark:text-gray-600',
      primary: 'text-blue-500 dark:text-blue-400',
      success: 'text-green-500 dark:text-green-400',
      warning: 'text-yellow-500 dark:text-yellow-400',
      error: 'text-red-500 dark:text-red-400'
    };

    const classes = cn(
      'animate-spin',
      sizeClasses[size],
      variantClasses[variant],
      className
    );

    return (
      <div
        ref={ref}
        className="inline-flex items-center gap-2"
        role="status"
        aria-label={label}
        {...props}
      >
        <svg
          className={classes}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {label && (
          <span className="sr-only">{label}</span>
        )}
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';

export { Spinner }; 
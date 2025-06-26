import React, { forwardRef, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  autoResize?: boolean;
  maxRows?: number;
}

const Input = React.memo(forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      variant = 'outlined',
      size = 'md',
      leftIcon,
      rightIcon,
      autoResize = false,
      maxRows = 3,
      disabled,
      onFocus,
      onBlur,
      onChange,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Memoizacja funkcji obsługi focus
    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setIsFocused(true);
      if (autoResize) {
        onFocus?.(e as React.FocusEvent<HTMLInputElement>);
      } else {
        onFocus?.(e as React.FocusEvent<HTMLInputElement>);
      }
    }, [autoResize, onFocus]);

    // Memoizacja funkcji obsługi blur
    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setIsFocused(false);
      if (autoResize) {
        onBlur?.(e as React.FocusEvent<HTMLInputElement>);
      } else {
        onBlur?.(e as React.FocusEvent<HTMLInputElement>);
      }
    }, [autoResize, onBlur]);

    // Memoizacja funkcji obsługi change
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setHasValue(value.length > 0);
      
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const scrollHeight = textareaRef.current.scrollHeight;
        const maxHeight = maxRows * 24; // 24px per line
        textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      }
      
      if (autoResize) {
        onChange?.(e as React.ChangeEvent<HTMLInputElement>);
      } else {
        onChange?.(e as React.ChangeEvent<HTMLInputElement>);
      }
    }, [autoResize, maxRows, onChange]);

    // Memoizacja klas CSS
    const inputClasses = useMemo(() => {
      const baseClasses = cn(
        'w-full transition-all duration-200 ease-in-out',
        'placeholder:text-gray-400',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none',
        size === 'sm' && 'text-sm px-3 py-2',
        size === 'md' && 'text-base px-4 py-3',
        size === 'lg' && 'text-lg px-5 py-4'
      );

      const variantClasses = {
        outlined: cn(
          'border rounded-lg',
          'bg-transparent',
          'border-gray-300 dark:border-gray-600',
          'focus:border-blue-500 dark:focus:border-blue-400',
          'focus:ring-2 focus:ring-blue-500/20',
          error && 'border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500/20'
        ),
        filled: cn(
          'border-b-2 rounded-t-lg',
          'bg-gray-50 dark:bg-gray-800',
          'border-gray-300 dark:border-gray-600',
          'focus:border-blue-500 dark:focus:border-blue-400',
          'focus:bg-white dark:focus:bg-gray-700',
          error && 'border-red-500 dark:border-red-400'
        ),
        standard: cn(
          'border-b-2',
          'bg-transparent',
          'border-gray-300 dark:border-gray-600',
          'focus:border-blue-500 dark:focus:border-blue-400',
          error && 'border-red-500 dark:border-red-400'
        )
      };

      return cn(baseClasses, variantClasses[variant]);
    }, [size, variant, error]);

    // Memoizacja klas label
    const labelClasses = useMemo(() => {
      return cn(
        'absolute left-0 transition-all duration-200 ease-in-out pointer-events-none',
        size === 'sm' && 'text-sm',
        size === 'md' && 'text-base',
        size === 'lg' && 'text-lg',
        'text-gray-500 dark:text-gray-400',
        (isFocused || hasValue) && 'text-blue-500 dark:text-blue-400',
        error && 'text-red-500 dark:text-red-400',
        size === 'sm' && (isFocused || hasValue) ? '-top-2 left-2 text-xs' : 'top-2 left-3',
        size === 'md' && (isFocused || hasValue) ? '-top-2 left-2 text-xs' : 'top-3 left-4',
        size === 'lg' && (isFocused || hasValue) ? '-top-2 left-2 text-xs' : 'top-4 left-5'
      );
    }, [size, isFocused, hasValue, error]);

    // Memoizacja klas ikon
    const iconClasses = useMemo(() => {
      return cn(
        'absolute top-1/2 transform -translate-y-1/2',
        'text-gray-400 dark:text-gray-500',
        size === 'sm' && 'w-4 h-4',
        size === 'md' && 'w-5 h-5',
        size === 'lg' && 'w-6 h-6'
      );
    }, [size]);

    // Memoizacja klas helper text
    const helperTextClasses = useMemo(() => {
      return cn(
        'mt-1 text-sm',
        error ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
      );
    }, [error]);

    if (autoResize) {
      return (
        <div className="relative">
          <textarea
            ref={textareaRef}
            className={cn(inputClasses, 'resize-none overflow-hidden')}
            onFocus={handleFocus as React.FocusEventHandler<HTMLTextAreaElement>}
            onBlur={handleBlur as React.FocusEventHandler<HTMLTextAreaElement>}
            onChange={handleChange as React.ChangeEventHandler<HTMLTextAreaElement>}
            disabled={disabled}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
          {label && (
            <label className={labelClasses}>
              {label}
            </label>
          )}
          {(helperText || error) && (
            <p className={helperTextClasses}>
              {error || helperText}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="relative">
        {leftIcon && (
          <div className={cn(iconClasses, 'left-3')}>
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            inputClasses,
            leftIcon && 'pl-10',
            rightIcon && 'pr-10'
          )}
          onFocus={handleFocus as React.FocusEventHandler<HTMLInputElement>}
          onBlur={handleBlur as React.FocusEventHandler<HTMLInputElement>}
          onChange={handleChange as React.ChangeEventHandler<HTMLInputElement>}
          disabled={disabled}
          {...props}
        />
        {rightIcon && (
          <div className={cn(iconClasses, 'right-3')}>
            {rightIcon}
          </div>
        )}
        {label && (
          <label className={labelClasses}>
            {label}
          </label>
        )}
        {(helperText || error) && (
          <p className={helperTextClasses}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
));

Input.displayName = 'Input';

export default Input; 
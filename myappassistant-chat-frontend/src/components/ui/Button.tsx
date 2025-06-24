import React from 'react';
import { useTheme } from '../ThemeProvider';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = ''
}: ButtonProps) {
  const { resolvedTheme } = useTheme();

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    primary: resolvedTheme === 'dark'
      ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
      : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: resolvedTheme === 'dark'
      ? 'bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
    outline: resolvedTheme === 'dark'
      ? 'border border-gray-600 hover:bg-gray-700 text-gray-300 hover:text-white focus:ring-gray-500'
      : 'border border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900 focus:ring-gray-500',
    ghost: resolvedTheme === 'dark'
      ? 'hover:bg-gray-700 text-gray-300 hover:text-white focus:ring-gray-500'
      : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900 focus:ring-gray-500'
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
      )}
      {children}
    </button>
  );
} 
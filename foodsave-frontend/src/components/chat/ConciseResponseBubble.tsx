import React from 'react';
import { useTheme } from '../ThemeProvider';
import { Badge } from '../ui/Badge';

interface ConciseResponseBubbleProps {
  content: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  onExpand?: () => void;
}

/**
 * ConciseResponseBubble component for displaying short AI responses.
 * 
 * This component provides a compact way to display AI responses
 * with different types and expandable content, following the .cursorrules guidelines.
 */
const ConciseResponseBubble: React.FC<ConciseResponseBubbleProps> = ({
  content,
  type,
  timestamp,
  onExpand
}) => {
  const { resolvedTheme } = useTheme();

  const typeConfig = {
    info: {
      icon: 'ℹ️',
      badgeVariant: 'info' as const,
      bgColor: resolvedTheme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50',
      borderColor: resolvedTheme === 'dark' ? 'border-blue-700' : 'border-blue-200'
    },
    success: {
      icon: '✅',
      badgeVariant: 'success' as const,
      bgColor: resolvedTheme === 'dark' ? 'bg-green-900/20' : 'bg-green-50',
      borderColor: resolvedTheme === 'dark' ? 'border-green-700' : 'border-green-200'
    },
    warning: {
      icon: '⚠️',
      badgeVariant: 'warning' as const,
      bgColor: resolvedTheme === 'dark' ? 'bg-yellow-900/20' : 'bg-yellow-50',
      borderColor: resolvedTheme === 'dark' ? 'border-yellow-700' : 'border-yellow-200'
    },
    error: {
      icon: '❌',
      badgeVariant: 'error' as const,
      bgColor: resolvedTheme === 'dark' ? 'bg-red-900/20' : 'bg-red-50',
      borderColor: resolvedTheme === 'dark' ? 'border-red-700' : 'border-red-200'
    }
  };

  const config = typeConfig[type];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pl-PL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`
      flex justify-start mb-4
    `}>
      <div className={`
        max-w-xs lg:max-w-md p-3 rounded-2xl border
        ${config.bgColor} ${config.borderColor}
        transition-all duration-200 hover:shadow-md
      `}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{config.icon}</span>
            <Badge variant={config.badgeVariant} size="sm">
              {type === 'info' && 'Informacja'}
              {type === 'success' && 'Sukces'}
              {type === 'warning' && 'Ostrzeżenie'}
              {type === 'error' && 'Błąd'}
            </Badge>
          </div>
          <span className={`
            text-xs opacity-70
            ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}
          `}>
            {formatTime(timestamp)}
          </span>
        </div>

        {/* Content */}
        <div className={`
          text-sm leading-relaxed
          ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}
        `}>
          {content}
        </div>

        {/* Expand Button */}
        {onExpand && (
          <button
            onClick={onExpand}
            className={`
              mt-2 text-xs font-medium hover:underline transition-colors
              ${resolvedTheme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}
            `}
          >
            Rozwiń odpowiedź →
          </button>
        )}
      </div>
    </div>
  );
};

export default ConciseResponseBubble; 
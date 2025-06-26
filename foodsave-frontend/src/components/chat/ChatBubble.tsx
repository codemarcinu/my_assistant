import React from 'react';
import { useTheme } from '../ThemeProvider';
import type { ChatMessage } from '../../types';

interface ChatBubbleProps {
  message: ChatMessage;
}

/**
 * ChatBubble component for displaying individual chat messages.
 * 
 * This component provides a consistent way to display chat messages
 * with proper styling and timestamps, following the .cursorrules guidelines.
 */
export default function ChatBubble({ message }: ChatBubbleProps) {
  const { resolvedTheme } = useTheme();
  const isUser = message.type === 'user';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pl-PL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-xs lg:max-w-md ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
        {/* Avatar */}
        {!isUser && (
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-semibold">AI</span>
          </div>
        )}
        
        {/* Message Bubble */}
        <div className={`
          relative px-4 py-2 rounded-2xl shadow-sm
          ${isUser 
            ? resolvedTheme === 'dark'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-500 text-white'
            : resolvedTheme === 'dark'
              ? 'bg-gray-700 text-gray-100'
              : 'bg-gray-100 text-gray-900'
          }
        `}>
          {/* Message Content */}
          <div className="text-sm leading-relaxed">
            {message.content}
          </div>
          
          {/* Timestamp */}
          <div className={`
            text-xs mt-1 opacity-70
            ${isUser ? 'text-right' : 'text-left'}
          `}>
            {formatTime(message.timestamp)}
          </div>
          
          {/* Message Tail */}
          <div className={`
            absolute top-0 w-3 h-3 transform rotate-45
            ${isUser 
              ? resolvedTheme === 'dark'
                ? 'bg-blue-600 -right-1.5'
                : 'bg-blue-500 -right-1.5'
              : resolvedTheme === 'dark'
                ? 'bg-gray-700 -left-1.5'
                : 'bg-gray-100 -left-1.5'
            }
          `} />
        </div>
        
        {/* User Avatar */}
        {isUser && (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-semibold">U</span>
          </div>
        )}
      </div>
    </div>
  );
} 
import React, { useState, useRef } from 'react';
import { useTheme } from '../ThemeProvider';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isTyping: boolean;
}

export default function MessageInput({ onSendMessage, isTyping }: MessageInputProps) {
  const { resolvedTheme } = useTheme();
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isTyping && !isComposing) {
      onSendMessage(message);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = () => setIsComposing(false);

  return (
    <form onSubmit={handleSubmit} className="flex items-end space-x-3">
      {/* Input Field */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder="Napisz wiadomość..."
          disabled={isTyping}
          className={`
            w-full resize-none rounded-xl px-4 py-3 pr-12 text-sm
            border transition-all duration-200 focus:outline-none focus:ring-2
            ${resolvedTheme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
              : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
            }
            ${isTyping ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
        
        {/* Character Counter */}
        {message.length > 0 && (
          <div className="absolute bottom-2 right-3 text-xs text-gray-400">
            {message.length}/1000
          </div>
        )}
      </div>

      {/* Send Button */}
      <button
        type="submit"
        disabled={!message.trim() || isTyping || isComposing}
        className={`
          p-3 rounded-xl transition-all duration-200 flex items-center justify-center
          ${message.trim() && !isTyping && !isComposing
            ? resolvedTheme === 'dark'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            : resolvedTheme === 'dark'
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {isTyping ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        )}
      </button>
    </form>
  );
} 
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../ThemeProvider';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import type { ChatMessage } from '../../types';

interface ChatBubbleProps {
  message: ChatMessage;
}

/**
 * ChatBubble component for displaying individual chat messages.
 * 
 * This component provides a consistent way to display chat messages
 * with proper styling, timestamps, and animations, following the .cursorrules guidelines.
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

  // Determine message status
  const getMessageStatus = () => {
    if (message.metadata?.status === 'sending') return 'sending';
    if (message.metadata?.status === 'error') return 'error';
    if (message.metadata?.status === 'sent') return 'sent';
    return 'default';
  };

  const messageStatus = getMessageStatus();

  const getStatusIcon = () => {
    switch (messageStatus) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      case 'sent':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <motion.div 
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className={`flex max-w-xs lg:max-w-md ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
        {/* Avatar */}
        {!isUser && (
          <motion.div 
            className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          >
            <span className="text-white text-sm font-semibold">AI</span>
          </motion.div>
        )}
        
        {/* Message Bubble */}
        <motion.div 
          className={`
            relative px-4 py-2 rounded-2xl shadow-sm
            ${isUser 
              ? resolvedTheme === 'dark'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-500 text-white'
              : resolvedTheme === 'dark'
                ? 'bg-gray-700 text-gray-100'
                : 'bg-gray-100 text-gray-900'
            }
            ${messageStatus === 'sending' ? 'opacity-70' : ''}
            ${messageStatus === 'error' ? 'border-2 border-red-300' : ''}
          `}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {/* Message Content */}
          <div className="text-sm leading-relaxed">
            {message.content}
          </div>
          
          {/* Timestamp and Status */}
          <div className={`
            flex items-center text-xs mt-1 opacity-70 space-x-1
            ${isUser ? 'justify-end' : 'justify-start'}
          `}>
            <span>{formatTime(message.timestamp)}</span>
            {isUser && getStatusIcon()}
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
        </motion.div>
        
        {/* User Avatar */}
        {isUser && (
          <motion.div 
            className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          >
            <span className="text-white text-sm font-semibold">U</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
} 
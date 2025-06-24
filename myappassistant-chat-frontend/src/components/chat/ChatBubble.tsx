import React from 'react';
import { Message } from '../../types/chat';

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const timestamp = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`
            px-4 py-2 rounded-lg text-sm
            ${isUser
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
            }
          `}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {timestamp}
        </div>
      </div>
      
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-2 ${isUser ? 'order-1' : 'order-2'}`}>
        {isUser ? (
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">U</span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">AI</span>
          </div>
        )}
      </div>
    </div>
  );
}; 
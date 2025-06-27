import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../ThemeProvider';
import ChatBubble from './ChatBubble';
import ConciseResponseBubble from './ConciseResponseBubble';
import MessageInput from './MessageInput';
import { useChatStore } from '../../stores/chatStore';
import type { ChatMessage } from '../../types';

/**
 * ChatContainer component for managing chat interface.
 * 
 * This component provides the main chat interface with message history,
 * input handling, and AI responses, following the .cursorrules guidelines.
 */
export default function ChatContainer() {
  const { resolvedTheme } = useTheme();
  const { messages, isLoading, sendMessage, loadChatHistory } = useChatStore();
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load chat history on component mount
    loadChatHistory();
  }, [loadChatHistory]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    setIsTyping(true);
    try {
      await sendMessage(content);
    } finally {
      setIsTyping(false);
    }
  };

  const generateAIResponse = (userMessage: string): string => {
    const responses = [
      'Rozumiem! To bardzo interesujące pytanie.',
      'Dziękuję za informację. Pozwól mi to przemyśleć.',
      'Świetnie! Mogę Ci w tym pomóc.',
      'To dobry punkt. Oto co mogę zaproponować:',
      'Interesujące podejście. Sprawdźmy to razem.',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const renderMessage = (message: ChatMessage) => {
    // Check if it's a concise response
    if (message.type === 'assistant' && message.metadata?.isConcise) {
      return (
        <ConciseResponseBubble
          key={message.id}
          content={message.content}
          type={message.metadata.responseType || 'info'}
          timestamp={message.timestamp}
          onExpand={() => {
            // Handle expand functionality
            console.log('Expand message:', message.id);
          }}
        />
      );
    }

    return <ChatBubble key={message.id} message={message} />;
  };

  return (
    <div className={`
      flex flex-col h-full rounded-xl overflow-hidden shadow-lg
      ${resolvedTheme === 'dark' 
        ? 'bg-gray-800 border border-gray-700' 
        : 'bg-white border border-gray-200'
      }
    `}>
      {/* Chat Header */}
      <div className={`
        flex items-center justify-between px-6 py-4 border-b
        ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
      `}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">AI</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">FoodSave AI</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isTyping || isLoading ? 'Pisze...' : 'Online'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Aktywny</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🍽️</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Witaj w FoodSave AI!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Jestem Twoim asystentem do zarządzania spiżarnią i zakupami. 
              Jak mogę Ci dzisiaj pomóc?
            </p>
          </div>
        )}
        
        {messages.map(renderMessage)}
        
        {(isTyping || isLoading) && (
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm">AI pisze...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <MessageInput 
          onSendMessage={handleSendMessage} 
          isTyping={isTyping || isLoading} 
        />
      </div>
    </div>
  );
} 
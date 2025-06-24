import React, { useRef, useEffect } from 'react';
import { ChatBubble } from './ChatBubble';
import { MessageInput } from './MessageInput';
import { useChatStore } from '../../stores/chatStore';
import { Spinner } from '../ui';

export const ChatContainer: React.FC = () => {
  const { messages, isLoading, error, sendMessage } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Welcome to FoodSave AI
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              I'm your intelligent assistant for managing your pantry, finding recipes, and helping with meal planning. 
              Start by asking me about your food items or what you'd like to cook today!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))
        )}
        
        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <Spinner size="sm" />
            <span className="text-sm">AI is thinking...</span>
          </div>
        )}
        {error && (
          <div className="text-sm text-red-500 dark:text-red-400">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <MessageInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}; 
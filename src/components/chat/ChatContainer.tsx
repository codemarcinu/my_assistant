import React, { useState } from 'react';
import { ChatBubble } from './ChatBubble';
import { MessageInput } from './MessageInput';
import { useChatStore } from '../../stores/chatStore';
import { Message } from '../../types/chat';

export const ChatContainer: React.FC = () => {
  const { messages, addMessage, isLoading } = useChatStore();
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    addMessage(userMessage);
    setInputValue('');

    // Symulacja odpowiedzi AI
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Odpowiedź na: ${message}`,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };
      addMessage(aiMessage);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
      <div className="p-4 border-t">
        <MessageInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSendMessage}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}; 
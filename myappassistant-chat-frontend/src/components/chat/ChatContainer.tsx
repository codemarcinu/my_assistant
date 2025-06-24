import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../ThemeProvider';
import ChatBubble from './ChatBubble';
import MessageInput from './MessageInput';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'image' | 'file';
}

export default function ChatContainer() {
  const { resolvedTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Cześć! Jestem FoodSave AI. Jak mogę Ci dzisiaj pomóc?',
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(content),
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
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
              {isTyping ? 'Pisze...' : 'Online'}
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
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
        
        {isTyping && (
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
        <MessageInput onSendMessage={sendMessage} isTyping={isTyping} />
      </div>
    </div>
  );
} 
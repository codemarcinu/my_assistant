"use client";

import { useState, useCallback } from "react";
import { chatAPI } from "@/lib/api";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  agentType?: string;
  isStreaming?: boolean;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Dodaj tymczasową wiadomość asystenta dla efektu strumieniowania
      const tempAssistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "",
        role: 'assistant',
        timestamp: new Date(),
        isStreaming: true
      };

      setMessages(prev => [...prev, tempAssistantMessage]);

      // Wyślij wiadomość do backendu
      const response = await chatAPI.sendMessage({
        message: content,
        session_id: "default",
        usePerplexity: false,
        useBielik: true,
        agent_states: {}
      });

      // Zaktualizuj tymczasową wiadomość rzeczywistą odpowiedzią
      setMessages(prev => prev.map(msg => 
        msg.id === tempAssistantMessage.id 
          ? {
              ...msg,
              content: response.data.text || response.data.data?.reply || "Przepraszam, nie udało się przetworzyć Twojego zapytania.",
              isStreaming: false,
              agentType: response.data.data?.agent_type
            }
          : msg
      ));

    } catch (error) {
      console.error("Błąd wysyłania wiadomości:", error);
      
      // Zaktualizuj tymczasową wiadomość błędem
      setMessages(prev => prev.map(msg => 
        msg.isStreaming 
          ? {
              ...msg,
              content: "Przepraszam, wystąpił błąd podczas przetwarzania Twojego zapytania. Spróbuj ponownie.",
              isStreaming: false
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading
  };
} 
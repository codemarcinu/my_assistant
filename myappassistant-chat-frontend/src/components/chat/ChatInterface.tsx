"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  agentType?: string;
  isStreaming?: boolean;
}

export function ChatInterface() {
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, isLoading } = useChat();

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user' as const,
      timestamp: new Date()
    };

    setInputValue("");
    setIsStreaming(true);
    
    try {
      await sendMessage(inputValue);
    } catch (error) {
      console.error("Błąd wysyłania wiadomości:", error);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Obszar wiadomości */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Witaj w Mój Asystent
              </h3>
              <p className="text-slate-400 max-w-md">
                Jestem Twoim centrum dowodzenia AI. Pytaj mnie o dokumenty, przepisy, 
                pogodę lub ogólne pytania. Przekieruję Twoje zapytanie do najlepszego agenta.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
          
          {isStreaming && <TypingIndicator />}
        </div>
      </ScrollArea>

      {/* Obszar wprowadzania */}
      <div className="border-t border-slate-700 p-4 bg-slate-800/30">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Wpisz wiadomość... (Enter aby wysłać, Shift+Enter dla nowej linii)"
            className="flex-1 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {/* Szybkie akcje */}
        <div className="flex gap-2 mt-3">
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-slate-700 border-slate-600 text-slate-300"
            onClick={() => setInputValue("Przeanalizuj ten paragon")}
          >
            📄 OCR
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-slate-700 border-slate-600 text-slate-300"
            onClick={() => setInputValue("Jaka jest pogoda?")}
          >
            🌤️ Pogoda
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-slate-700 border-slate-600 text-slate-300"
            onClick={() => setInputValue("Zaproponuj przepis na kolację")}
          >
            👨‍🍳 Przepis
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-slate-700 border-slate-600 text-slate-300"
            onClick={() => setInputValue("Wyszukaj informacje o...")}
          >
            🔍 Wyszukaj
          </Badge>
        </div>
      </div>
    </div>
  );
} 
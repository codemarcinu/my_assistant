"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, User, Loader2 } from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  agentType?: string;
  isStreaming?: boolean;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <Avatar className="w-8 h-8">
          <AvatarImage src={isUser ? undefined : undefined} />
          <AvatarFallback className={isUser ? 'bg-blue-600' : 'bg-slate-600'}>
            {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
          </AvatarFallback>
        </Avatar>
        
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <Card className={`${isUser ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'} border-0`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                {isStreaming && <Loader2 className="w-4 h-4 animate-spin" />}
                <span className="text-sm font-medium">
                  {isUser ? 'Ty' : message.agentType || 'Asystent'}
                </span>
                {message.agentType && !isUser && (
                  <Badge variant="outline" className="text-xs bg-slate-600/50 border-slate-500">
                    {message.agentType}
                  </Badge>
                )}
              </div>
              
              <div className="whitespace-pre-wrap text-sm">
                {isStreaming ? (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                ) : (
                  message.content
                )}
              </div>
            </CardContent>
          </Card>
          
          <span className="text-xs text-slate-400 mt-1">
            {message.timestamp.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
} 
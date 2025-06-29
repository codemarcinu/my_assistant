"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-3 max-w-[80%]">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-slate-600">
            <Bot className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
        
        <Card className="bg-slate-700 text-white border-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Asystent</span>
            </div>
            
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
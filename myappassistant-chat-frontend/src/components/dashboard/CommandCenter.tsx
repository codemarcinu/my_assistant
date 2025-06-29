"use client";

import { useState } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { AgentControlPanel } from "@/components/agents/AgentControlPanel";
import { SystemMonitor } from "@/components/monitoring/SystemMonitor";
import { RAGModule } from "@/components/rag/RAGModule";
import { DeveloperConsole } from "@/components/developer/DeveloperConsole";
import { AdvancedSettings } from "@/components/settings/AdvancedSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Bot, 
  Activity, 
  Database, 
  Settings, 
  Terminal,
  Users,
  Zap
} from "lucide-react";

interface AgentStatus {
  id: string;
  name: string;
  status: 'active' | 'busy' | 'error' | 'inactive';
  description: string;
  lastActivity: string;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  agentType: string;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  activeAgents: number;
  totalConversations: number;
  responseTime: number;
}

export function CommandCenter() {
  const [activeTab, setActiveTab] = useState("chat");
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);

  // Mock data - w prawdziwej aplikacji to będzie z API
  const agents: AgentStatus[] = [
    {
      id: "1",
      name: "Agent OCR",
      status: "active",
      description: "Przetwarzanie dokumentów i paragonów",
      lastActivity: "2 min temu"
    },
    {
      id: "2", 
      name: "Agent RAG",
      status: "active",
      description: "Wyszukiwanie w bazie wiedzy",
      lastActivity: "1 min temu"
    },
    {
      id: "3",
      name: "Agent Kulinarny", 
      status: "busy",
      description: "Sugestie kulinarne",
      lastActivity: "30 sek temu"
    },
    {
      id: "4",
      name: "Agent Pogodowy",
      status: "active", 
      description: "Informacje pogodowe",
      lastActivity: "5 min temu"
    }
  ];

  const activeConversations: Conversation[] = [
    {
      id: "1",
      title: "Dyskusja o przepisach",
      lastMessage: "Jakich składników potrzebuję do carbonary?",
      timestamp: "2 min temu",
      agentType: "Agent Kulinarny"
    },
    {
      id: "2", 
      title: "Analiza dokumentu",
      lastMessage: "Proszę przeanalizować ten paragon",
      timestamp: "5 min temu",
      agentType: "Agent OCR"
    }
  ];

  const systemMetrics: SystemMetrics = {
    cpu: 45,
    memory: 67,
    activeAgents: 4,
    totalConversations: 12,
    responseTime: 234
  };

  return (
    <div className="container mx-auto p-6">
      {/* Nagłówek */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Mój Asystent
            </h1>
            <p className="text-slate-300">
              Centrum Dowodzenia AI - Zaawansowany System Zarządzania Agentami
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-green-500/20 text-green-400">
              <Activity className="w-3 h-3 mr-1" />
              System Online
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeveloperMode(!isDeveloperMode)}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <Terminal className="w-4 h-4 mr-2" />
              Tryb Deweloperski
            </Button>
          </div>
        </div>
      </div>

      {/* Główna zawartość */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lewy panel - Status agentów */}
        <div className="lg:col-span-1">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Status Agentów
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AgentControlPanel agents={agents} />
            </CardContent>
          </Card>

          {/* Monitor systemu */}
          <Card className="bg-slate-800/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Monitor Systemu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SystemMonitor metrics={systemMetrics} />
            </CardContent>
          </Card>
        </div>

        {/* Główny obszar czatu */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800/50 border-slate-700 h-[calc(100vh-200px)]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Interfejs Dowodzenia AI
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full p-0">
              <ChatInterface />
            </CardContent>
          </Card>
        </div>

        {/* Prawy panel - Moduły */}
        <div className="lg:col-span-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800">
              <TabsTrigger value="rag" className="text-slate-300">
                <Database className="w-4 h-4 mr-1" />
                Baza Wiedzy
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-slate-300">
                <Settings className="w-4 h-4 mr-1" />
                Ustawienia
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="rag" className="mt-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <RAGModule />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <AdvancedSettings />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Konsola deweloperska */}
      {isDeveloperMode && (
        <div className="mt-6">
          <DeveloperConsole />
        </div>
      )}
    </div>
  );
} 
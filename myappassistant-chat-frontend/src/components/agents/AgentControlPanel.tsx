"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Activity, Zap, AlertCircle, CheckCircle } from "lucide-react";

interface AgentStatus {
  id: string;
  name: string;
  status: 'active' | 'busy' | 'error' | 'inactive';
  description: string;
  lastActivity: string;
}

interface AgentControlPanelProps {
  agents: AgentStatus[];
}

export function AgentControlPanel({ agents }: AgentControlPanelProps) {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'busy': return <Activity className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-3">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
      
      <div className="pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-300">Automatyczne przekierowywanie</span>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Równoważenie obciążenia</span>
          <Switch defaultChecked />
        </div>
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: AgentStatus }) {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'busy': return <Activity className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <Card className="bg-slate-700/50 border-slate-600 hover:bg-slate-700/70 transition-colors">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
            <span className="text-sm font-medium text-white">{agent.name}</span>
          </div>
          <Badge variant="outline" className="text-xs bg-slate-600/50 border-slate-500">
            {agent.status === 'active' ? 'aktywny' : 
             agent.status === 'busy' ? 'zajęty' : 
             agent.status === 'error' ? 'błąd' : 'nieaktywny'}
          </Badge>
        </div>
        
        <p className="text-xs text-slate-400 mb-2">{agent.description}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">{agent.lastActivity}</span>
          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
            <Zap className="w-3 h-3 mr-1" />
            Test
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 
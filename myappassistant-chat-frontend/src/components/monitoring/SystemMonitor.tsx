"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Cpu, HardDrive, Clock, Users } from "lucide-react";

interface SystemMetrics {
  cpu: number;
  memory: number;
  activeAgents: number;
  totalConversations: number;
  responseTime: number;
}

interface SystemMonitorProps {
  metrics: SystemMetrics;
}

export function SystemMonitor({ metrics }: SystemMonitorProps) {
  return (
    <div className="space-y-4">
      {/* Użycie CPU */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-slate-300">Użycie CPU</span>
          </div>
          <Badge variant="outline" className="text-xs bg-slate-600/50 border-slate-500">
            {metrics.cpu}%
          </Badge>
        </div>
        <Progress value={metrics.cpu} className="h-2" />
      </div>

      {/* Użycie pamięci */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-green-400" />
            <span className="text-sm text-slate-300">Użycie pamięci</span>
          </div>
          <Badge variant="outline" className="text-xs bg-slate-600/50 border-slate-500">
            {metrics.memory}%
          </Badge>
        </div>
        <Progress value={metrics.memory} className="h-2" />
      </div>

      {/* Aktywne agenty */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-slate-300">Aktywne agenty</span>
        </div>
        <Badge className="bg-purple-500/20 text-purple-400">
          {metrics.activeAgents}
        </Badge>
      </div>

      {/* Łączna liczba konwersacji */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-400" />
          <span className="text-sm text-slate-300">Łączna liczba konwersacji</span>
        </div>
        <Badge className="bg-orange-500/20 text-orange-400">
          {metrics.totalConversations}
        </Badge>
      </div>

      {/* Czas odpowiedzi */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-slate-300">Średni czas odpowiedzi</span>
        </div>
        <Badge className="bg-cyan-500/20 text-cyan-400">
          {metrics.responseTime}ms
        </Badge>
      </div>

      {/* Status systemu */}
      <div className="pt-3 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Status systemu</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-400">Sprawny</span>
          </div>
        </div>
      </div>
    </div>
  );
} 
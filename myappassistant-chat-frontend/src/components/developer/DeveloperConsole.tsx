"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Trash2, Play, Square, Zap, AlertTriangle } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
}

export function DeveloperConsole() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [filter, setFilter] = useState('all');

  // Symulacja generowania logów
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        level: ['info', 'warn', 'error', 'debug'][Math.floor(Math.random() * 4)] as any,
        message: `Wpis logu systemu ${Date.now()}`,
        source: 'system'
      };
      
      setLogs(prev => [...prev.slice(-50), newLog]); // Zachowaj ostatnie 50 logów
    }, 2000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const clearLogs = () => {
    setLogs([]);
  };

  const getLevelColor = (level: string) => {
    switch(level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'debug': return 'text-blue-400';
      default: return 'text-green-400';
    }
  };

  const getLevelIcon = (level: string) => {
    switch(level) {
      case 'error': return <AlertTriangle className="w-3 h-3" />;
      case 'warn': return <AlertTriangle className="w-3 h-3" />;
      case 'debug': return <Zap className="w-3 h-3" />;
      default: return <Terminal className="w-3 h-3" />;
    }
  };

  const filteredLogs = logs.filter(log => 
    filter === 'all' || log.level === filter
  );

  return (
    <Card className="bg-slate-800/80 border-slate-600">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Konsola Deweloperska
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-slate-500">
              {logs.length} logów
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsMonitoring(!isMonitoring)}
              className="border-slate-600 text-slate-300"
            >
              {isMonitoring ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearLogs}
              className="border-slate-600 text-slate-300"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Kontrolki filtrów */}
        <div className="flex gap-2 mb-4">
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className="text-xs"
          >
            Wszystkie
          </Button>
          <Button
            size="sm"
            variant={filter === 'info' ? 'default' : 'outline'}
            onClick={() => setFilter('info')}
            className="text-xs"
          >
            Informacje
          </Button>
          <Button
            size="sm"
            variant={filter === 'warn' ? 'default' : 'outline'}
            onClick={() => setFilter('warn')}
            className="text-xs"
          >
            Ostrzeżenia
          </Button>
          <Button
            size="sm"
            variant={filter === 'error' ? 'default' : 'outline'}
            onClick={() => setFilter('error')}
            className="text-xs"
          >
            Błędy
          </Button>
          <Button
            size="sm"
            variant={filter === 'debug' ? 'default' : 'outline'}
            onClick={() => setFilter('debug')}
            className="text-xs"
          >
            Debug
          </Button>
        </div>

        {/* Wyświetlanie logów */}
        <ScrollArea className="h-64 bg-slate-900/50 rounded border border-slate-700 p-2">
          <div className="space-y-1">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Brak dostępnych logów</p>
                <p className="text-xs">Rozpocznij monitorowanie, aby zobaczyć logi systemu</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 text-xs font-mono"
                >
                  <span className="text-slate-500 min-w-[80px]">
                    {new Date(log.timestamp).toLocaleTimeString('pl-PL')}
                  </span>
                  <div className={`flex items-center gap-1 min-w-[60px] ${getLevelColor(log.level)}`}>
                    {getLevelIcon(log.level)}
                    <span className="uppercase">
                      {log.level === 'info' ? 'info' : 
                       log.level === 'warn' ? 'ostrz' : 
                       log.level === 'error' ? 'błąd' : 'debug'}
                    </span>
                  </div>
                  <span className="text-slate-400 min-w-[80px]">[{log.source}]</span>
                  <span className="text-slate-300 flex-1">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Szybkie akcje */}
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" className="flex-1 border-slate-600 text-slate-300">
            <Zap className="w-3 h-3 mr-1" />
            Test API
          </Button>
          <Button size="sm" variant="outline" className="flex-1 border-slate-600 text-slate-300">
            <Terminal className="w-3 h-3 mr-1" />
            Informacje systemowe
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 
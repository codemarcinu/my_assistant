"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';
import { AgentStatus } from '@/hooks/useWebSocket';

export const CommandCenter: React.FC = () => {
  const {
    isConnected,
    error,
    reconnectAttempts,
    agents,
    systemMetrics,
    events,
    requestAgentStatus,
    requestSystemMetrics,
    subscribeToAgent,
    unsubscribeFromAgent,
  } = useWebSocketContext();

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected) {
      requestAgentStatus();
      requestSystemMetrics();
    }
  }, [isConnected, requestAgentStatus, requestSystemMetrics]);

  const handleAgentClick = (agentName: string) => {
    if (selectedAgent === agentName) {
      unsubscribeFromAgent(agentName);
      setSelectedAgent(null);
    } else {
      if (selectedAgent) {
        unsubscribeFromAgent(selectedAgent);
      }
      subscribeToAgent(agentName);
      setSelectedAgent(agentName);
    }
  };

  const getStatusColor = (status: AgentStatus['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      case 'processing': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: AgentStatus['status']) => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'error': return 'Błąd';
      case 'processing': return 'Przetwarzanie';
      default: return 'Nieznany';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Status Połączenia
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          </CardTitle>
          <CardDescription>
            {isConnected ? 'Połączony z serwerem WebSocket' : 'Brak połączenia'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
              <p className="text-red-800 text-sm">Błąd: {error}</p>
            </div>
          )}
          {reconnectAttempts > 0 && (
            <p className="text-sm text-gray-600">
              Próby ponownego połączenia: {reconnectAttempts}
            </p>
          )}
        </CardContent>
      </Card>

      {/* System Metrics */}
      {systemMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>Metryki Systemu</CardTitle>
            <CardDescription>Informacje o wydajności systemu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">CPU</p>
                <p className="text-2xl font-bold">{systemMetrics.cpu}%</p>
              </div>
              <div>
                <p className="text-sm font-medium">RAM</p>
                <p className="text-2xl font-bold">{systemMetrics.memory}%</p>
              </div>
              <div>
                <p className="text-sm font-medium">Dysk</p>
                <p className="text-2xl font-bold">{systemMetrics.disk}%</p>
              </div>
              <div>
                <p className="text-sm font-medium">Sieć</p>
                <p className="text-2xl font-bold">{systemMetrics.network}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agents */}
      <Card>
        <CardHeader>
          <CardTitle>Agenci AI</CardTitle>
          <CardDescription>Status i zarządzanie agentami</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedAgent === agent.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleAgentClick(agent.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
                    <div>
                      <h3 className="font-medium">{agent.name}</h3>
                      <p className="text-sm text-gray-600">
                        {getStatusText(agent.status)} • Ostatnia aktywność: {agent.lastActivity}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {agent.responseTime && (
                      <Badge variant="secondary">{agent.responseTime}ms</Badge>
                    )}
                    {agent.confidence && (
                      <Badge variant="outline">{agent.confidence}%</Badge>
                    )}
                    {selectedAgent === agent.name && (
                      <Badge variant="default">Wybrany</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {agents.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                Brak dostępnych agentów
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ostatnie Wydarzenia</CardTitle>
            <CardDescription>Log aktywności systemu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {events.map((event, index) => (
                <div key={index} className="p-2 border rounded text-sm">
                  <p className="font-medium">{String(event.type)}</p>
                  <p className="text-gray-600">{String(event.timestamp)}</p>
                  {typeof event.data !== 'undefined' && (
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(event.data as any, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 
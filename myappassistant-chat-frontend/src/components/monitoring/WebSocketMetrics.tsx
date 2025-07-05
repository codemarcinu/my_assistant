"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';

interface WebSocketMetrics {
  connectionCount: number;
  disconnectCount: number;
  reconnectAttempts: number;
  successfulReconnects: number;
  failedReconnects: number;
  heartbeatCount: number;
  heartbeatTimeouts: number;
  averageResponseTime: number;
  errorCount: number;
  lastConnectionTime: string | null;
  uptime: number; // seconds
  circuitBreakerTrips: number;
}

export const WebSocketMetrics: React.FC = () => {
  const { isConnected, error, reconnectAttempts, agents, systemMetrics } = useWebSocketContext();
  const [metrics, setMetrics] = useState<WebSocketMetrics>({
    connectionCount: 0,
    disconnectCount: 0,
    reconnectAttempts: 0,
    successfulReconnects: 0,
    failedReconnects: 0,
    heartbeatCount: 0,
    heartbeatTimeouts: 0,
    averageResponseTime: 0,
    errorCount: 0,
    lastConnectionTime: null,
    uptime: 0,
    circuitBreakerTrips: 0,
  });

  const [startTime] = useState<number>(Date.now());

  // Update uptime every second
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        uptime: Math.floor((Date.now() - startTime) / 1000)
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Track connection events
  useEffect(() => {
    if (isConnected) {
      setMetrics(prev => ({
        ...prev,
        connectionCount: prev.connectionCount + 1,
        lastConnectionTime: new Date().toISOString(),
        reconnectAttempts: reconnectAttempts
      }));
    } else {
      setMetrics(prev => ({
        ...prev,
        disconnectCount: prev.disconnectCount + 1
      }));
    }
  }, [isConnected, reconnectAttempts]);

  // Track errors
  useEffect(() => {
    if (error) {
      setMetrics(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1
      }));
    }
  }, [error]);

  // Calculate average response time from agents
  useEffect(() => {
    const responseTimes = agents
      .map(agent => agent.responseTime)
      .filter(time => time !== undefined) as number[];
    
    if (responseTimes.length > 0) {
      const average = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      setMetrics(prev => ({
        ...prev,
        averageResponseTime: Math.round(average)
      }));
    }
  }, [agents]);

  const exportPrometheusMetrics = () => {
    const prometheusMetrics = [
      `# HELP websocket_connections_total Total number of WebSocket connections`,
      `# TYPE websocket_connections_total counter`,
      `websocket_connections_total ${metrics.connectionCount}`,
      '',
      `# HELP websocket_disconnections_total Total number of WebSocket disconnections`,
      `# TYPE websocket_disconnections_total counter`,
      `websocket_disconnections_total ${metrics.disconnectCount}`,
      '',
      `# HELP websocket_reconnect_attempts_total Total number of reconnect attempts`,
      `# TYPE websocket_reconnect_attempts_total counter`,
      `websocket_reconnect_attempts_total ${metrics.reconnectAttempts}`,
      '',
      `# HELP websocket_errors_total Total number of WebSocket errors`,
      `# TYPE websocket_errors_total counter`,
      `websocket_errors_total ${metrics.errorCount}`,
      '',
      `# HELP websocket_uptime_seconds Current WebSocket uptime in seconds`,
      `# TYPE websocket_uptime_seconds gauge`,
      `websocket_uptime_seconds ${metrics.uptime}`,
      '',
      `# HELP websocket_average_response_time_ms Average response time in milliseconds`,
      `# TYPE websocket_average_response_time_ms gauge`,
      `websocket_average_response_time_ms ${metrics.averageResponseTime}`,
      '',
      `# HELP websocket_connected Current connection status`,
      `# TYPE websocket_connected gauge`,
      `websocket_connected ${isConnected ? 1 : 0}`,
    ].join('\n');

    const blob = new Blob([prometheusMetrics], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'websocket_metrics.prom';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6" data-testid="websocket-metrics">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            WebSocket Metrics
            <Button onClick={exportPrometheusMetrics} variant="outline" size="sm">
              Export Prometheus
            </Button>
          </CardTitle>
          <CardDescription>
            Real-time monitoring and metrics for WebSocket connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{metrics.connectionCount}</p>
              <p className="text-sm text-gray-600">Connections</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{metrics.disconnectCount}</p>
              <p className="text-sm text-gray-600">Disconnections</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{metrics.reconnectAttempts}</p>
              <p className="text-sm text-gray-600">Reconnect Attempts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{metrics.errorCount}</p>
              <p className="text-sm text-gray-600">Errors</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Connection Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant={isConnected ? "default" : "destructive"}>
                    {isConnected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Uptime:</span>
                  <span className="font-mono">{formatUptime(metrics.uptime)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Connected:</span>
                  <span className="text-sm">
                    {metrics.lastConnectionTime 
                      ? new Date(metrics.lastConnectionTime).toLocaleTimeString()
                      : "Never"
                    }
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Performance Metrics</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Avg Response Time:</span>
                  <span>{metrics.averageResponseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Agents:</span>
                  <span>{agents.filter(a => a.status === 'online').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Agents:</span>
                  <span>{agents.length}</span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <h4 className="font-medium text-red-800">Current Error</h4>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 
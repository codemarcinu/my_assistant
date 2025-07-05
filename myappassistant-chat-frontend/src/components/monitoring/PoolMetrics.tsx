"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useWebSocketPool } from '@/components/providers/WebSocketPoolProvider';

export const PoolMetrics: React.FC = () => {
  const { metrics, getConnectionCount, getHealthyConnectionCount } = useWebSocketPool();

  const healthPercentage = metrics.totalConnections > 0 
    ? (metrics.healthyConnections / metrics.totalConnections) * 100 
    : 0;

  const utilizationPercentage = 5 > 0 
    ? (metrics.totalConnections / 5) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>WebSocket Connection Pool</CardTitle>
          <CardDescription>
            Load balancing and connection pool metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{metrics.totalConnections}</p>
              <p className="text-sm text-gray-600">Total Connections</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{metrics.healthyConnections}</p>
              <p className="text-sm text-gray-600">Healthy</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{metrics.totalMessages}</p>
              <p className="text-sm text-gray-600">Messages Sent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{metrics.errors}</p>
              <p className="text-sm text-gray-600">Errors</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Connection Health</span>
                <Badge variant={healthPercentage > 80 ? "default" : healthPercentage > 50 ? "secondary" : "destructive"}>
                  {healthPercentage.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={healthPercentage} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Pool Utilization</span>
                <Badge variant={utilizationPercentage > 80 ? "destructive" : utilizationPercentage > 50 ? "secondary" : "default"}>
                  {utilizationPercentage.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={utilizationPercentage} className="h-2" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Connection Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Active:</span>
                  <Badge variant="default">{metrics.activeConnections}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Healthy:</span>
                  <Badge variant="default">{metrics.healthyConnections}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Errors:</span>
                  <Badge variant="destructive">{metrics.errors}</Badge>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Performance</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Avg Response Time:</span>
                  <span>{metrics.averageResponseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Messages/sec:</span>
                  <span>{metrics.totalMessages > 0 ? (metrics.totalMessages / Math.max(1, 60)).toFixed(2) : '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Error Rate:</span>
                  <span>{metrics.totalMessages > 0 ? ((metrics.errors / metrics.totalMessages) * 100).toFixed(2) : '0'}%</span>
                </div>
              </div>
            </div>
          </div>

          {metrics.errors > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <h4 className="font-medium text-red-800">Pool Issues Detected</h4>
              <p className="text-sm text-red-600">
                {metrics.errors} errors detected in the connection pool. 
                Consider checking network connectivity or server status.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 
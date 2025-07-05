"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export const OfflineStatus: React.FC = () => {
  const {
    isOnline,
    offlineQueue,
    isSyncing,
    lastSyncTime,
    syncOfflineMessages,
    clearOfflineQueue,
  } = useOfflineSync();

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getQueueSize = () => offlineQueue.length;

  const getOldestMessageAge = () => {
    if (offlineQueue.length === 0) return 0;
    const oldest = Math.min(...offlineQueue.map(msg => msg.timestamp));
    return Math.floor((Date.now() - oldest) / 1000 / 60); // minutes
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Status Offline
            <Badge variant={isOnline ? "default" : "destructive"}>
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Zarządzanie synchronizacją i kolejką wiadomości offline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{getQueueSize()}</p>
              <p className="text-sm text-gray-600">Wiadomości w kolejce</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{getOldestMessageAge()}</p>
              <p className="text-sm text-gray-600">Min. od najstarszej</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {isSyncing ? "Synchronizacja..." : "Gotowy"}
              </p>
              <p className="text-sm text-gray-600">Status sync</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {lastSyncTime ? formatTime(lastSyncTime) : "Nigdy"}
              </p>
              <p className="text-sm text-gray-600">Ostatnia sync</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Kolejka wiadomości</span>
                <Badge variant={getQueueSize() > 0 ? "secondary" : "default"}>
                  {getQueueSize()} wiadomości
                </Badge>
              </div>
              <Progress 
                value={Math.min(getQueueSize() * 10, 100)} 
                className="h-2" 
              />
            </div>

            {getQueueSize() > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <h4 className="font-medium text-yellow-800 mb-2">Wiadomości oczekujące</h4>
                <p className="text-sm text-yellow-600 mb-3">
                  Masz {getQueueSize()} wiadomości w kolejce offline. 
                  Zostaną wysłane automatycznie po przywróceniu połączenia.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={syncOfflineMessages}
                    disabled={!isOnline || isSyncing}
                    size="sm"
                  >
                    {isSyncing ? "Synchronizacja..." : "Synchronizuj teraz"}
                  </Button>
                  <Button 
                    onClick={clearOfflineQueue}
                    variant="outline"
                    size="sm"
                  >
                    Wyczyść kolejkę
                  </Button>
                </div>
              </div>
            )}

            {!isOnline && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <h4 className="font-medium text-red-800 mb-2">Brak połączenia</h4>
                <p className="text-sm text-red-600">
                  Jesteś offline. Nowe wiadomości będą zapisywane lokalnie 
                  i wysłane po przywróceniu połączenia.
                </p>
              </div>
            )}

            {isOnline && getQueueSize() === 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <h4 className="font-medium text-green-800 mb-2">Wszystko zsynchronizowane</h4>
                <p className="text-sm text-green-600">
                  Brak wiadomości w kolejce offline. Wszystko jest aktualne.
                </p>
              </div>
            )}
          </div>

          {offlineQueue.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-3">Ostatnie wiadomości w kolejce</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {offlineQueue.slice(-5).map((msg) => (
                  <div key={msg.id} className="p-2 border rounded text-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{msg.message.type || 'Unknown'}</p>
                        <p className="text-gray-600 text-xs">
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {Math.floor((Date.now() - msg.timestamp) / 1000 / 60)}m temu
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 
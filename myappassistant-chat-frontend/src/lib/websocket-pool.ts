import { AgentStatus, SystemMetrics, WebSocketEvent, WebSocketMessageSchema } from '@/hooks/useWebSocket';

export interface WebSocketConnection {
  id: string;
  url: string;
  ws: WebSocket;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastUsed: number;
  messageCount: number;
  errorCount: number;
  isHealthy: boolean;
}

export interface PoolConfig {
  maxConnections: number;
  minConnections: number;
  connectionTimeout: number;
  healthCheckInterval: number;
  loadBalancingStrategy: 'round-robin' | 'least-used' | 'health-based';
  urls: string[];
}

export interface PoolMetrics {
  totalConnections: number;
  activeConnections: number;
  healthyConnections: number;
  averageResponseTime: number;
  totalMessages: number;
  errors: number;
}

export class WebSocketPool {
  private connections: Map<string, WebSocketConnection> = new Map();
  private config: PoolConfig;
  private currentIndex = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private messageQueue: Array<{ message: any; priority: number }> = [];
  private isProcessingQueue = false;

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = {
      maxConnections: 5,
      minConnections: 2,
      connectionTimeout: 10000,
      healthCheckInterval: 30000,
      loadBalancingStrategy: 'health-based',
      urls: ['ws://localhost:8001/ws/dashboard'],
      ...config,
    };

    this.startHealthCheck();
  }

  private generateConnectionId(): string {
    return `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async createConnection(url: string): Promise<WebSocketConnection> {
    return new Promise((resolve, reject) => {
      const id = this.generateConnectionId();
      const ws = new WebSocket(url);
      
      const connection: WebSocketConnection = {
        id,
        url,
        ws,
        status: 'connecting',
        lastUsed: Date.now(),
        messageCount: 0,
        errorCount: 0,
        isHealthy: true,
      };

      const timeout = setTimeout(() => {
        reject(new Error(`Connection timeout for ${url}`));
      }, this.config.connectionTimeout);

      ws.onopen = () => {
        clearTimeout(timeout);
        connection.status = 'connected';
        connection.lastUsed = Date.now();
        this.connections.set(id, connection);
        resolve(connection);
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        connection.status = 'error';
        connection.errorCount++;
        connection.isHealthy = false;
        this.connections.set(id, connection);
        reject(error);
      };

      ws.onclose = () => {
        connection.status = 'disconnected';
        this.connections.delete(id);
      };
    });
  }

  private getBestConnection(): WebSocketConnection | null {
    const healthyConnections = Array.from(this.connections.values())
      .filter(conn => conn.status === 'connected' && conn.isHealthy);

    if (healthyConnections.length === 0) {
      return null;
    }

    switch (this.config.loadBalancingStrategy) {
      case 'round-robin':
        this.currentIndex = (this.currentIndex + 1) % healthyConnections.length;
        return healthyConnections[this.currentIndex];

      case 'least-used':
        return healthyConnections.reduce((min, conn) => 
          conn.messageCount < min.messageCount ? conn : min
        );

      case 'health-based':
      default:
        return healthyConnections.reduce((best, conn) => {
          const bestScore = best.isHealthy ? 1 : 0;
          const connScore = conn.isHealthy ? 1 : 0;
          return connScore > bestScore ? conn : best;
        });
    }
  }

  private async ensureMinConnections(): Promise<void> {
    const healthyConnections = Array.from(this.connections.values())
      .filter(conn => conn.status === 'connected' && conn.isHealthy);

    if (healthyConnections.length < this.config.minConnections) {
      const needed = this.config.minConnections - healthyConnections.length;
      const promises = [];

      for (let i = 0; i < needed; i++) {
        const url = this.config.urls[i % this.config.urls.length];
        promises.push(this.createConnection(url).catch(err => {
          console.warn(`Failed to create connection to ${url}:`, err);
        }));
      }

      await Promise.allSettled(promises);
    }
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  private performHealthCheck(): void {
    const now = Date.now();
    
    for (const [id, connection] of this.connections) {
      // Check if connection is stale
      if (now - connection.lastUsed > this.config.healthCheckInterval * 2) {
        console.log(`Removing stale connection ${id}`);
        connection.ws.close();
        this.connections.delete(id);
        continue;
      }

      // Send ping to check health
      if (connection.status === 'connected') {
        try {
          connection.ws.send(JSON.stringify({ type: 'ping', timestamp: now }));
        } catch (error) {
          console.warn(`Health check failed for connection ${id}:`, error);
          connection.isHealthy = false;
          connection.errorCount++;
        }
      }
    }

    // Ensure minimum connections
    this.ensureMinConnections();
  }

  private async processMessageQueue(): Promise<void> {
    if (this.isProcessingQueue || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.messageQueue.length > 0) {
      const { message, priority } = this.messageQueue.shift()!;
      const connection = this.getBestConnection();

      if (!connection) {
        // Re-queue message if no connection available
        this.messageQueue.unshift({ message, priority });
        break;
      }

      try {
        // Validate message
        const result = WebSocketMessageSchema.safeParse(message);
        if (!result.success) {
          throw new Error(`Invalid message format: ${result.error.message}`);
        }

        connection.ws.send(JSON.stringify(message));
        connection.messageCount++;
        connection.lastUsed = Date.now();
      } catch (error) {
        console.error('Failed to send message:', error);
        connection.errorCount++;
        connection.isHealthy = false;
        
        // Re-queue message with lower priority
        this.messageQueue.push({ message, priority: priority - 1 });
      }
    }

    this.isProcessingQueue = false;
  }

  async sendMessage(message: any, priority: number = 0): Promise<void> {
    // Add message to queue
    this.messageQueue.push({ message, priority });
    
    // Sort queue by priority (higher priority first)
    this.messageQueue.sort((a, b) => b.priority - a.priority);
    
    // Process queue
    await this.processMessageQueue();
  }

  async broadcastMessage(message: any): Promise<void> {
    const promises = Array.from(this.connections.values())
      .filter(conn => conn.status === 'connected')
      .map(conn => this.sendMessage(message));

    await Promise.allSettled(promises);
  }

  getMetrics(): PoolMetrics {
    const connections = Array.from(this.connections.values());
    const activeConnections = connections.filter(conn => conn.status === 'connected');
    const healthyConnections = activeConnections.filter(conn => conn.isHealthy);
    
    const totalMessages = connections.reduce((sum, conn) => sum + conn.messageCount, 0);
    const totalErrors = connections.reduce((sum, conn) => sum + conn.errorCount, 0);
    
    return {
      totalConnections: connections.length,
      activeConnections: activeConnections.length,
      healthyConnections: healthyConnections.length,
      averageResponseTime: 0, // Would need to track response times
      totalMessages,
      errors: totalErrors,
    };
  }

  async initialize(): Promise<void> {
    await this.ensureMinConnections();
  }

  async shutdown(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Close all connections
    const promises = Array.from(this.connections.values()).map(conn => {
      return new Promise<void>((resolve) => {
        conn.ws.onclose = () => resolve();
        conn.ws.close();
      });
    });

    await Promise.all(promises);
    this.connections.clear();
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  getHealthyConnectionCount(): number {
    return Array.from(this.connections.values())
      .filter(conn => conn.status === 'connected' && conn.isHealthy).length;
  }
} 
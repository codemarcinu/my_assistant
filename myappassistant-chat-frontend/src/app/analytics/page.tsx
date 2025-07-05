import { WebSocketMetrics } from '@/components/monitoring/WebSocketMetrics';
import { PoolMetrics } from '@/components/monitoring/PoolMetrics';
import { WebSocketPoolProvider } from '@/components/providers/WebSocketPoolProvider';

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Analytics & Monitoring</h1>
      <WebSocketMetrics />
      <WebSocketPoolProvider>
        <PoolMetrics />
      </WebSocketPoolProvider>
    </div>
  );
} 
import React, { useState, useEffect } from 'react';
import Card from '../ui/atoms/Card';
import Button from '../ui/atoms/Button';
import { Badge } from '../ui/atoms/Badge';
import { chatAPI } from '../../services/api';

interface MemoryStats {
  total_contexts: number;
  persistent_contexts: number;
  cached_contexts: number;
  compression_ratio: number;
  cache_hit_rate: number;
  max_contexts: number;
  cleanup_threshold: number;
  oldest_context?: string;
  newest_context?: string;
}

export const MemoryMonitorModule: React.FC = () => {
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getMemoryStats();
      if (response.data && response.data.stats) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching memory stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const optimizeMemory = async () => {
    try {
      setOptimizing(true);
      const response = await chatAPI.optimizeMemory();
      if (response.data) {
        // Refresh stats after optimization
        await fetchStats();
      }
    } catch (error) {
      console.error('Error optimizing memory:', error);
    } finally {
      setOptimizing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return (
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Memory Monitor</h3>
          <div className="text-center py-4">
            {loading ? 'Loading memory statistics...' : 'No memory data available'}
          </div>
        </div>
      </Card>
    );
  }

  const memoryUsagePercent = (stats.total_contexts / stats.max_contexts) * 100;
  const compressionEfficiency = (1 - stats.compression_ratio) * 100;

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Memory Monitor</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        
        <div className="space-y-4">
          {/* Memory Usage */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Memory Usage</span>
              <span className="text-sm text-muted-foreground">
                {stats.total_contexts} / {stats.max_contexts}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${memoryUsagePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{memoryUsagePercent.toFixed(1)}% used</span>
              <span>{stats.max_contexts - stats.total_contexts} available</span>
            </div>
          </div>

          {/* Storage Distribution */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.total_contexts}
              </div>
              <div className="text-xs text-muted-foreground">Active Contexts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.persistent_contexts}
              </div>
              <div className="text-xs text-muted-foreground">Persistent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.cached_contexts}
              </div>
              <div className="text-xs text-muted-foreground">Cached</div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Compression Efficiency</span>
              <Badge variant={compressionEfficiency > 70 ? "success" : "warning"}>
                {compressionEfficiency.toFixed(1)}%
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Cache Hit Rate</span>
              <Badge variant={stats.cache_hit_rate > 0.5 ? "success" : "warning"}>
                {(stats.cache_hit_rate * 100).toFixed(1)}%
              </Badge>
            </div>
          </div>

          {/* Context Age */}
          {stats.oldest_context && stats.newest_context && (
            <div className="text-xs text-muted-foreground">
              <div>Oldest context: {new Date(stats.oldest_context).toLocaleString()}</div>
              <div>Newest context: {new Date(stats.newest_context).toLocaleString()}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={optimizeMemory}
              disabled={optimizing}
              className="flex-1"
            >
              {optimizing ? 'Optimizing...' : 'Optimize Memory'}
            </Button>
          </div>

          {/* Status Indicators */}
          <div className="flex gap-2">
            <Badge variant={memoryUsagePercent < 80 ? "success" : "error"}>
              {memoryUsagePercent < 80 ? "Healthy" : "High Usage"}
            </Badge>
            <Badge variant={compressionEfficiency > 70 ? "success" : "warning"}>
              {compressionEfficiency > 70 ? "Optimized" : "Needs Optimization"}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}; 
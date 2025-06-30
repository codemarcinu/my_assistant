import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Alert,
} from '@mui/material';
import {
  Memory,
  Storage,
  NetworkCheck,
  Speed,
  Warning,
} from '@mui/icons-material';
import { SystemMetrics } from '@/hooks/useWebSocket';

interface SystemMonitorProps {
  metrics: SystemMetrics | null;
  isConnected: boolean;
}

export function SystemMonitor({ metrics, isConnected }: SystemMonitorProps) {
  if (!isConnected) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        Brak połączenia z serwerem. Dane mogą być nieaktualne.
      </Alert>
    );
  }

  if (!metrics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Typography variant="body1" color="text.secondary">
          Ładowanie metryk systemowych...
        </Typography>
      </Box>
    );
  }

  const getMetricColor = (value: number) => {
    if (value >= 80) return 'error';
    if (value >= 60) return 'warning';
    return 'success';
  };

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'cpu':
        return <Speed />;
      case 'memory':
        return <Memory />;
      case 'disk':
        return <Storage />;
      case 'network':
        return <NetworkCheck />;
      default:
        return <Speed />;
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Monitoring Systemu
      </Typography>

      <Grid container spacing={3}>
        {/* CPU Usage */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Speed sx={{ mr: 1 }} />
              <Typography variant="h6">CPU</Typography>
              <Chip
                label={`${metrics.cpu.toFixed(1)}%`}
                color={getMetricColor(metrics.cpu)}
                size="small"
                sx={{ ml: 'auto' }}
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={metrics.cpu}
              color={getMetricColor(metrics.cpu)}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Paper>
        </Grid>

        {/* Memory Usage */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Memory sx={{ mr: 1 }} />
              <Typography variant="h6">Pamięć</Typography>
              <Chip
                label={`${metrics.memory.toFixed(1)}%`}
                color={getMetricColor(metrics.memory)}
                size="small"
                sx={{ ml: 'auto' }}
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={metrics.memory}
              color={getMetricColor(metrics.memory)}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Paper>
        </Grid>

        {/* Disk Usage */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Storage sx={{ mr: 1 }} />
              <Typography variant="h6">Dysk</Typography>
              <Chip
                label={`${metrics.disk.toFixed(1)}%`}
                color={getMetricColor(metrics.disk)}
                size="small"
                sx={{ ml: 'auto' }}
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={metrics.disk}
              color={getMetricColor(metrics.disk)}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Paper>
        </Grid>

        {/* Network Usage */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <NetworkCheck sx={{ mr: 1 }} />
              <Typography variant="h6">Sieć</Typography>
              <Chip
                label={`${metrics.network.toFixed(1)}%`}
                color={getMetricColor(metrics.network)}
                size="small"
                sx={{ ml: 'auto' }}
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={metrics.network}
              color={getMetricColor(metrics.network)}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Paper>
        </Grid>

        {/* Active Connections */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Aktywne Połączenia
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                icon={<NetworkCheck />}
                label={`${metrics.activeConnections} połączeń`}
                color="primary"
                variant="outlined"
              />
              <Typography variant="body2" color="text.secondary">
                Ostatnia aktualizacja: {new Date(metrics.timestamp).toLocaleTimeString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 
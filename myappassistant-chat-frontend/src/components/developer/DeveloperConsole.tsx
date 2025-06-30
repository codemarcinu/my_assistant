import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Send,
  Clear,
  Code,
  BugReport,
  Storage,
  Api,
} from '@mui/icons-material';
import { agentsAPI } from '@/lib/api';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  data?: any;
}

export function DeveloperConsole() {
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLog = (level: LogEntry['level'], message: string, data?: any) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };
    setLogs(prev => [newLog, ...prev.slice(0, 49)]); // Keep last 50 logs
  };

  const executeCommand = async () => {
    if (!command.trim()) return;

    setIsExecuting(true);
    setError(null);
    addLog('info', `Wykonywanie komendy: ${command}`);

    try {
      const response = await agentsAPI.executeTask(command);
      addLog('info', 'Komenda wykonana pomyślnie', response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(errorMessage);
      addLog('error', `Błąd wykonania komendy: ${errorMessage}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'debug':
        return 'default';
      default:
        return 'info';
    }
  };

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return <BugReport fontSize="small" />;
      case 'warning':
        return <BugReport fontSize="small" />;
      case 'debug':
        return <Code fontSize="small" />;
      default:
        return <Api fontSize="small" />;
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Konsola Deweloperska
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Wpisz komendę deweloperską..."
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && executeCommand()}
          disabled={isExecuting}
          sx={{ fontFamily: 'monospace' }}
        />
        <Button
          variant="contained"
          onClick={executeCommand}
          disabled={!command.trim() || isExecuting}
          startIcon={<Send />}
        >
          Wykonaj
        </Button>
        <Tooltip title="Wyczyść logi">
          <IconButton onClick={clearLogs} color="error">
            <Clear />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Quick Commands */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Szybkie Komendy
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {[
            'health_check',
            'list_agents',
            'system_status',
            'clear_cache',
            'test_rag',
            'performance_test',
          ].map((cmd) => (
            <Chip
              key={cmd}
              label={cmd}
              onClick={() => setCommand(cmd)}
              variant="outlined"
              size="small"
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
      </Paper>

      {/* Logs */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Logi ({logs.length})
          </Typography>
          <Chip
            icon={<Storage />}
            label="Debug Mode"
            color="primary"
            size="small"
          />
        </Box>

        {logs.length === 0 ? (
          <Alert severity="info">
            Brak logów. Wykonaj komendę, aby zobaczyć logi.
          </Alert>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {logs.map((log, index) => (
              <React.Fragment key={log.id}>
                <ListItem sx={{ py: 1 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getLogIcon(log.level)}
                        <Typography variant="body2" component="span">
                          {log.message}
                        </Typography>
                        <Chip
                          label={log.level}
                          color={getLogColor(log.level)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(log.timestamp).toLocaleString()}
                        </Typography>
                        {log.data && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Dane: {JSON.stringify(log.data, null, 2)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < logs.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
} 
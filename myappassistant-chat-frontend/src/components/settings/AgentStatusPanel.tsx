"use client";

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Switch,
  FormControlLabel,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Refresh,
  Settings,
  CheckCircle,
  Error,
  Warning,
} from '@mui/icons-material';
import { useAgentStore } from '@/stores/agentStore';

export function AgentStatusPanel() {
  const { agents, toggleAgent, restartAgent } = useAgentStore();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'error':
        return <Error sx={{ color: 'error.main' }} />;
      case 'warning':
        return <Warning sx={{ color: 'warning.main' }} />;
      default:
        return <Error sx={{ color: 'error.main' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'error';
    }
  };

  const handleToggleAgent = (agentId: string) => {
    toggleAgent(agentId);
  };

  const handleRestartAgent = (agentId: string) => {
    restartAgent(agentId);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Status Agentów
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => window.location.reload()}
        >
          Odśwież Status
        </Button>
      </Box>

      <Grid container spacing={3}>
        {agents.map((agent) => (
          <Grid item xs={12} md={6} lg={4} key={agent.id}>
            <Card
              sx={{
                border: agent.status === 'active' ? '2px solid #22c55e' : '2px solid transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 'var(--shadow-lg)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(agent.status)}
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {agent.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Uruchom/Zatrzymaj">
                      <IconButton
                        size="small"
                        onClick={() => handleToggleAgent(agent.id)}
                        sx={{
                          color: agent.status === 'active' ? 'error.main' : 'success.main',
                        }}
                      >
                        {agent.status === 'active' ? <Stop /> : <PlayArrow />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Restart">
                      <IconButton
                        size="small"
                        onClick={() => handleRestartAgent(agent.id)}
                        sx={{ color: 'text.secondary' }}
                      >
                        <Refresh />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Ustawienia">
                      <IconButton
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        <Settings />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  {agent.description}
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Chip
                    label={agent.status}
                    color={getStatusColor(agent.status) as any}
                    size="small"
                  />
                  <Chip
                    label={agent.type}
                    variant="outlined"
                    size="small"
                  />
                  {agent.version && (
                    <Chip
                      label={`v${agent.version}`}
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={agent.status === 'active'}
                        onChange={() => handleToggleAgent(agent.id)}
                        color="primary"
                      />
                    }
                    label="Aktywny"
                  />
                  
                  {agent.lastActivity && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Ostatnia aktywność: {new Date(agent.lastActivity).toLocaleString('pl-PL')}
                    </Typography>
                  )}
                </Box>

                {agent.error && (
                  <Box sx={{ mt: 2, p: 1, background: 'rgba(244, 67, 54, 0.1)', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ color: 'error.main' }}>
                      Błąd: {agent.error}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {agents.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
            Brak dostępnych agentów
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Agenty pojawią się tutaj po uruchomieniu systemu
          </Typography>
        </Box>
      )}
    </Box>
  );
} 
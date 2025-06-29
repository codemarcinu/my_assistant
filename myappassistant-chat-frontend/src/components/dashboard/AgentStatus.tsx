"use client";

import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  SmartToy,
  CheckCircle,
  Error,
  Schedule,
  Pause,
} from '@mui/icons-material';
import { useAgentStore } from '@/stores/agentStore';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return <CheckCircle sx={{ fontSize: 16, color: '#34C759' }} />;
    case 'busy':
      return <Schedule sx={{ fontSize: 16, color: '#FF9500' }} />;
    case 'error':
      return <Error sx={{ fontSize: 16, color: '#FF3B30' }} />;
    case 'idle':
      return <Pause sx={{ fontSize: 16, color: '#8E8E93' }} />;
    default:
      return <Pause sx={{ fontSize: 16, color: '#8E8E93' }} />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return '#34C759';
    case 'busy':
      return '#FF9500';
    case 'error':
      return '#FF3B30';
    case 'idle':
      return '#8E8E93';
    default:
      return '#8E8E93';
  }
};

export function AgentStatus() {
  const theme = useTheme();
  const { agents } = useAgentStore();

  return (
    <Box 
      sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
      data-testid="agent-status-list"
    >
      {agents.map((agent) => (
        <Box
          key={agent.id}
          data-testid={`agent-item-${agent.id}`}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1.5,
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.05)',
            },
            transition: 'background 0.2s ease-in-out',
          }}
        >
          {/* Avatar agenta */}
          <Avatar
            data-testid={`agent-avatar-${agent.id}`}
            sx={{
              width: 32,
              height: 32,
              background: agent.color,
              fontSize: '0.8rem',
            }}
          >
            <SmartToy sx={{ fontSize: 16 }} />
          </Avatar>

          {/* Informacje o agencie */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography
                variant="body2"
                data-testid={`agent-name-${agent.id}`}
                sx={{
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  color: 'text.primary',
                }}
              >
                {agent.name}
              </Typography>
              {getStatusIcon(agent.status)}
            </Box>
            
            <Typography
              variant="caption"
              data-testid={`agent-description-${agent.id}`}
              sx={{
                color: 'text.secondary',
                fontSize: '0.7rem',
                display: 'block',
                lineHeight: 1.2,
              }}
            >
              {agent.description}
            </Typography>
            
            <Typography
              variant="caption"
              data-testid={`agent-activity-${agent.id}`}
              sx={{
                color: getStatusColor(agent.status),
                fontSize: '0.65rem',
                display: 'block',
                mt: 0.5,
              }}
            >
              {agent.lastActivity}
            </Typography>
          </Box>

          {/* Status chip */}
          <Chip
            data-testid={`agent-status-chip-${agent.id}`}
            label={agent.status}
            size="small"
            sx={{
              fontSize: '0.6rem',
              height: 20,
              background: `${getStatusColor(agent.status)}20`,
              color: getStatusColor(agent.status),
              border: `1px solid ${getStatusColor(agent.status)}40`,
            }}
          />
        </Box>
      ))}
    </Box>
  );
} 
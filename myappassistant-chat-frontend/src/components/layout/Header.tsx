"use client";

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Badge,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  Settings,
  Notifications,
} from '@mui/icons-material';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAgentStore } from '@/stores/agentStore';
import { useRouter, usePathname } from 'next/navigation';

export function Header() {
  const theme = useTheme();
  const { settings, toggleTheme } = useSettingsStore();
  const { agents } = useAgentStore();
  const router = useRouter();
  const pathname = usePathname() || "";

  const activeAgents = agents.filter(agent => agent.status === 'active').length;
  const isSettingsActive = pathname === "/settings";

  const handleSettingsClick = () => {
    router.push('/settings');
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      data-testid="header"
      sx={{
        background: 'rgba(28, 28, 30, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo i tytuł */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            data-testid="app-logo"
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(45deg, #007AFF 30%, #5856D6 90%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: 'white',
                fontWeight: 700,
                fontSize: '1.2rem',
              }}
            >
              AI
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="h5"
              data-testid="app-title"
              sx={{
                fontWeight: 600,
                background: 'linear-gradient(45deg, #007AFF 30%, #5856D6 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              FoodSave AI
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '0.75rem',
              }}
            >
              Centrum Dowodzenia AI
            </Typography>
          </Box>
        </Box>

        {/* Status agentów */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            data-testid="agent-status"
            label={`${activeAgents}/5 Agentów Aktywnych`}
            color="success"
            size="small"
            sx={{
              background: 'rgba(52, 199, 89, 0.2)',
              color: '#34C759',
              border: '1px solid rgba(52, 199, 89, 0.3)',
            }}
          />
        </Box>

        {/* Akcje */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            data-testid="theme-toggle"
            onClick={toggleTheme}
            sx={{
              color: 'text.primary',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            {settings.theme === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          
          <IconButton
            data-testid="notifications-button"
            sx={{
              color: 'text.primary',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          
          <IconButton
            data-testid="settings-button"
            onClick={handleSettingsClick}
            sx={{
              color: isSettingsActive ? '#007AFF' : 'text.primary',
              background: isSettingsActive ? 'rgba(0,122,255,0.12)' : 'none',
              border: isSettingsActive ? '2px solid #007AFF' : 'none',
              boxShadow: isSettingsActive ? '0 2px 8px 0 #007AFF33' : 'none',
              '&:hover': {
                background: 'rgba(0,122,255,0.18)',
              },
              transition: 'all 0.25s cubic-bezier(.4,2,.6,1)',
            }}
          >
            <Settings />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
} 
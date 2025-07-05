"use client";

import React, { useState, lazy, Suspense } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Chat,
  SmartToy,
  Monitor,
  LibraryBooks,
  Settings,
  Code,
  Refresh,
  Wifi,
  WifiOff,
} from '@mui/icons-material';
import { useWebSocket } from '@/hooks/useWebSocket';
import { WebSocketErrorBoundary } from '@/components/common/WebSocketErrorBoundary';

// Lazy load components for better performance
const Dashboard = lazy(() => import('./Dashboard').then(module => ({ default: module.Dashboard })));
const AgentStatus = lazy(() => import('./AgentStatus').then(module => ({ default: module.AgentStatus })));
const SystemMonitor = lazy(() => import('../monitoring/SystemMonitor').then(module => ({ default: module.SystemMonitor })));
const RAGModule = lazy(() => import('../rag/RAGModule').then(module => ({ default: module.RAGModule })));
const SettingsPanel = lazy(() => import('../settings/SettingsPanel').then(module => ({ default: module.SettingsPanel })));
const DeveloperConsole = lazy(() => import('../developer/DeveloperConsole').then(module => ({ default: module.DeveloperConsole })));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`command-center-tabpanel-${index}`}
      aria-labelledby={`command-center-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `command-center-tab-${index}`,
    'aria-controls': `command-center-tabpanel-${index}`,
  };
}

export function CommandCenter() {
  const [activeTab, setActiveTab] = useState(0);
  const [isDevMode, setIsDevMode] = useState(false);

  // WebSocket for real-time monitoring
  const {
    isConnected: wsConnected,
    agents: wsAgents,
    systemMetrics,
    error: wsError,
    reconnectAttempts,
    requestAgentStatus,
    requestSystemMetrics,
    connect: reconnect,
  } = useWebSocket();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    if (wsConnected) {
      requestAgentStatus();
      requestSystemMetrics();
    } else {
      reconnect();
    }
  };

  const getConnectionStatus = () => {
    if (wsConnected) {
      return {
        status: 'connected',
        color: 'success',
        icon: <Wifi />,
        text: 'Połączony',
      };
    } else if (reconnectAttempts > 0) {
      return {
        status: 'reconnecting',
        color: 'warning',
        icon: <Wifi />,
        text: `Ponowne łączenie (${reconnectAttempts})`,
      };
    } else {
      return {
        status: 'disconnected',
        color: 'error',
        icon: <WifiOff />,
        text: 'Rozłączony',
      };
    }
  };

  const connectionStatus = getConnectionStatus();

  return (
    <WebSocketErrorBoundary>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header with connection status */}
      <Paper
        sx={{
          p: 2,
          borderRadius: 0,
          borderBottom: '1px solid var(--color-card-border)',
          background: 'var(--color-surface)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Command Center
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Connection Status */}
            <Chip
              icon={connectionStatus.icon}
              label={connectionStatus.text}
              color={connectionStatus.color as any}
              variant="outlined"
              size="small"
            />
            
            {/* Refresh Button */}
            <Tooltip title="Odśwież dane">
              <IconButton
                onClick={handleRefresh}
                disabled={!wsConnected && reconnectAttempts > 0}
                size="small"
              >
                <Refresh />
              </IconButton>
            </Tooltip>
            
            {/* Dev Mode Toggle */}
            <Tooltip title="Tryb deweloperski">
              <IconButton
                onClick={() => setIsDevMode(!isDevMode)}
                color={isDevMode ? 'primary' : 'default'}
                size="small"
              >
                <Code />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* WebSocket Error Alert */}
      {wsError && (
        <Alert
          severity="error"
          sx={{ m: 2, borderRadius: 2 }}
          action={
            <IconButton
              color="inherit"
              size="small"
              onClick={reconnect}
            >
              <Refresh />
            </IconButton>
          }
        >
          Błąd połączenia WebSocket: {wsError}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', background: 'var(--color-surface)' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Command center tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontWeight: 500,
            },
          }}
        >
          <Tab
            icon={<Chat />}
            label="Czat"
            {...a11yProps(0)}
            sx={{ minWidth: 100 }}
          />
          <Tab
            icon={<SmartToy />}
            label={`Agenty (${wsAgents.length})`}
            {...a11yProps(1)}
            sx={{ minWidth: 120 }}
          />
          <Tab
            icon={<Monitor />}
            label="Monitoring"
            {...a11yProps(2)}
            sx={{ minWidth: 120 }}
          />
          <Tab
            icon={<LibraryBooks />}
            label="RAG"
            {...a11yProps(3)}
            sx={{ minWidth: 80 }}
          />
          <Tab
            icon={<Settings />}
            label="Ustawienia"
            {...a11yProps(4)}
            sx={{ minWidth: 120 }}
          />
          {isDevMode && (
            <Tab
              icon={<Code />}
              label="Konsola"
              {...a11yProps(5)}
              sx={{ minWidth: 100 }}
            />
          )}
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <TabPanel value={activeTab} index={0}>
          <Suspense fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <CircularProgress />
            </Box>
          }>
            <Dashboard />
          </Suspense>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Suspense fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <CircularProgress />
            </Box>
          }>
            <AgentStatus />
          </Suspense>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Suspense fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <CircularProgress />
            </Box>
          }>
            <SystemMonitor metrics={systemMetrics} isConnected={wsConnected} />
          </Suspense>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Suspense fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <CircularProgress />
            </Box>
          }>
            <RAGModule />
          </Suspense>
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <Suspense fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <CircularProgress />
            </Box>
          }>
            <SettingsPanel />
          </Suspense>
        </TabPanel>

        {isDevMode && (
          <TabPanel value={activeTab} index={5}>
            <Suspense fallback={
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress />
              </Box>
            }>
              <DeveloperConsole />
            </Suspense>
          </TabPanel>
        )}
      </Box>
      </Box>
    </WebSocketErrorBoundary>
  );
} 
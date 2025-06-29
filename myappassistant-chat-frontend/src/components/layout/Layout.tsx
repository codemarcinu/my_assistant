"use client";

import React, { useState } from 'react';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { theme, lightTheme } from '@/lib/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import dynamic from 'next/dynamic';

// Dynamic imports z NoSSR aby uniknąć błędów hydratacji
const Dashboard = dynamic(() => import('@/components/dashboard/Dashboard').then(mod => ({ default: mod.Dashboard })), { 
  ssr: false,
  loading: () => <div>Ładowanie...</div>
});

const AgentStatusPanel = dynamic(() => import('@/components/settings/AgentStatusPanel').then(mod => ({ default: mod.AgentStatusPanel })), { 
  ssr: false,
  loading: () => <div>Ładowanie...</div>
});

interface LayoutProps {
  children?: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { settings } = useSettingsStore();
  const currentTheme = settings.theme === 'dark' ? theme : lightTheme;
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'settings':
        return <AgentStatusPanel />;
      case 'ocr':
        return <div>OCR Section - Coming Soon</div>;
      case 'pantry':
        return <div>Pantry Section - Coming Soon</div>;
      case 'analytics':
        return <div>Analytics Section - Coming Soon</div>;
      case 'rag':
        return <div>RAG Section - Coming Soon</div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #000000 0%, #1C1C1E 50%, #000000 100%)',
        }}
      >
        <Header />
        <Box sx={{ display: 'flex', flex: 1 }}>
          <Sidebar 
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
          />
          <MainContent>
            {children || renderSectionContent()}
          </MainContent>
        </Box>
      </Box>
    </ThemeProvider>
  );
} 
"use client";

import React from 'react';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { theme, lightTheme } from '@/lib/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { settings } = useSettingsStore();
  const currentTheme = settings.theme === 'dark' ? theme : lightTheme;

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
          <Sidebar />
          <MainContent>
            {children}
          </MainContent>
        </Box>
      </Box>
    </ThemeProvider>
  );
} 
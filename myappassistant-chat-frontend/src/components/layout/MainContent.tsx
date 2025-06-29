"use client";

import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';

interface MainContentProps {
  children: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        ml: isMobile ? 0 : '240px', // drawer width
        p: 3,
        minHeight: 'calc(100vh - 64px)', // AppBar height
        background: 'transparent',
      }}
    >
      {children}
    </Box>
  );
} 
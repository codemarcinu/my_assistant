"use client";

import React from 'react';
import { Box, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';

interface PageLoaderProps {
  isLoading: boolean;
}

export function PageLoader({ isLoading }: PageLoaderProps) {
  if (!isLoading) return null;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
      }}
    >
      <LinearProgress
        sx={{
          height: 3,
          background: 'rgba(0, 122, 255, 0.1)',
          '& .MuiLinearProgress-bar': {
            background: 'linear-gradient(90deg, #007AFF 0%, #5856D6 100%)',
            animation: 'loading 1.5s ease-in-out infinite',
          },
          '@keyframes loading': {
            '0%': {
              transform: 'translateX(-100%)',
            },
            '50%': {
              transform: 'translateX(0%)',
            },
            '100%': {
              transform: 'translateX(100%)',
            },
          },
        }}
      />
    </Box>
  );
} 
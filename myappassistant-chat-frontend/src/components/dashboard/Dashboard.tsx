"use client";

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { ChatWindow } from '../chat/ChatWindow';
import { QuickCommands } from './QuickCommands';
import { AgentStatus } from './AgentStatus';
import { FileUploadArea } from '../common/FileUploadArea';

export function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (files: File[]) => {
    setIsUploading(true);
    try {
      // Tutaj będzie logika upload'u plików
      console.log('Uploading files:', files);
      // Symulacja upload'u
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box 
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      data-testid="dashboard"
    >
      {/* Główny grid */}
      <Grid container spacing={3} sx={{ flex: 1, minHeight: 0 }}>
        {/* Lewy panel - Status agentów */}
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Status Agentów
              </Typography>
              <AgentStatus />
            </CardContent>
          </Card>
        </Grid>

        {/* Główny obszar - Okno czatu */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
              <ChatWindow />
            </CardContent>
          </Card>
        </Grid>

        {/* Prawy panel - Komendy i upload */}
        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
            {/* Gotowe komendy */}
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Gotowe Komendy
                </Typography>
                <QuickCommands />
              </CardContent>
            </Card>

            {/* Upload plików */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Upload Plików
                </Typography>
                <FileUploadArea
                  accept={['image/jpeg', 'image/png', 'application/pdf']}
                  maxSize={10 * 1024 * 1024} // 10MB
                  onUpload={handleFileUpload}
                  preview={true}
                  isUploading={isUploading}
                />
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
} 
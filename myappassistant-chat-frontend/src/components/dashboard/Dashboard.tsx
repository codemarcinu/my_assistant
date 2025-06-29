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
import { useTranslation } from 'react-i18next';

export function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isUploading, setIsUploading] = useState(false);
  const { t } = useTranslation();

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
        {/* Główny obszar - Okno czatu (rozszerzony) */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
              <ChatWindow />
            </CardContent>
          </Card>
        </Grid>

        {/* Prawy panel - Komendy i upload (przesunięty do prawej) */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
            {/* Gotowe komendy */}
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  {t('dashboard.ready_commands')}
                </Typography>
                <QuickCommands />
              </CardContent>
            </Card>

            {/* Upload plików */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  {t('dashboard.file_upload')}
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
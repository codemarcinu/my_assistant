import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { AgentStatus } from '../dashboard/AgentStatus';
import { useTranslation } from 'react-i18next';
import { FontSizeSettings } from './FontSizeSettings';

export function AgentStatusPanel() {
  const { t } = useTranslation();
  return (
    <Box>
      <FontSizeSettings />
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
          {t('settings.agent_status')}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <AgentStatus />
      </Box>
    </Box>
  );
} 
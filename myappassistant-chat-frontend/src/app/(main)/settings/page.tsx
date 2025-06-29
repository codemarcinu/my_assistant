"use client";

import React from 'react';
import { Box, Container, Typography, Tabs, Tab } from '@mui/material';
import { AgentStatusPanel } from '@/components/settings/AgentStatusPanel';
import { FontSizeSettings } from '@/components/settings/FontSizeSettings';
import { QuickCommandsEditor } from '@/components/settings/QuickCommandsEditor';

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SettingsPage() {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        Ustawienia
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="settings tabs"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '1rem',
            },
          }}
        >
          <Tab label="Szybkie Komendy" />
          <Tab label="Agenty" />
          <Tab label="Wygląd" />
        </Tabs>
      </Box>

      <TabPanel value={value} index={0}>
        <QuickCommandsEditor />
      </TabPanel>

      <TabPanel value={value} index={1}>
        <AgentStatusPanel />
      </TabPanel>

      <TabPanel value={value} index={2}>
        <FontSizeSettings />
      </TabPanel>
    </Container>
  );
} 
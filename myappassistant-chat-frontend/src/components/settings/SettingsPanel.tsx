import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import { AgentStatusPanel } from './AgentStatusPanel';
import { QuickCommandsEditor } from './QuickCommandsEditor';
import { FontSizeSettings } from './FontSizeSettings';
import { RAGDatabaseManager } from './RAGDatabaseManager';

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
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

export function SettingsPanel() {
  const [activeTab, setActiveTab] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Ustawienia Systemu
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Settings tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
            },
          }}
        >
          <Tab label="Agenty" {...a11yProps(0)} />
          <Tab label="Szybkie Komendy" {...a11yProps(1)} />
          <Tab label="Wygląd" {...a11yProps(2)} />
          <Tab label="Baza Wiedzy" {...a11yProps(3)} />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <AgentStatusPanel />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <QuickCommandsEditor />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <FontSizeSettings />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <RAGDatabaseManager />
        </TabPanel>
      </Paper>
    </Box>
  );
} 
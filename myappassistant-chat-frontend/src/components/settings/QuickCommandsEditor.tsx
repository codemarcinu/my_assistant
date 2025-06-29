"use client";

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  DragIndicator,
  WbSunny,
  Restaurant,
  Receipt,
  Search,
  Analytics,
  CloudUpload,
} from '@mui/icons-material';
import { useQuickCommandsStore, QuickCommand } from '@/stores/quickCommandsStore';
import { useAgentStore } from '@/stores/agentStore';

// Mapowanie ikon
const iconMap: Record<string, React.ReactNode> = {
  WbSunny: <WbSunny />,
  Restaurant: <Restaurant />,
  Receipt: <Receipt />,
  Search: <Search />,
  Analytics: <Analytics />,
  CloudUpload: <CloudUpload />,
};

const availableIcons = [
  { value: 'WbSunny', label: 'Pogoda', icon: <WbSunny /> },
  { value: 'Restaurant', label: 'Restauracja', icon: <Restaurant /> },
  { value: 'Receipt', label: 'Paragon', icon: <Receipt /> },
  { value: 'Search', label: 'Wyszukiwanie', icon: <Search /> },
  { value: 'Analytics', label: 'Analityka', icon: <Analytics /> },
  { value: 'CloudUpload', label: 'Upload', icon: <CloudUpload /> },
];

export function QuickCommandsEditor() {
  const { commands, addCommand, updateCommand, deleteCommand, toggleCommand } = useQuickCommandsStore();
  const { agents } = useAgentStore();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCommand, setEditingCommand] = useState<QuickCommand | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'Search',
    command: '',
    agentId: '',
    isActive: true,
  });

  const handleOpenDialog = (command?: QuickCommand) => {
    if (command) {
      setEditingCommand(command);
      setFormData({
        title: command.title,
        description: command.description,
        icon: command.icon,
        command: command.command,
        agentId: command.agentId || '',
        isActive: command.isActive,
      });
    } else {
      setEditingCommand(null);
      setFormData({
        title: '',
        description: '',
        icon: 'Search',
        command: '',
        agentId: '',
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCommand(null);
  };

  const handleSave = () => {
    if (editingCommand) {
      updateCommand(editingCommand.id, formData);
    } else {
      addCommand(formData);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć tę komendę?')) {
      deleteCommand(id);
    }
  };

  const handleToggle = (id: string) => {
    toggleCommand(id);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Szybkie Komendy
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{
            background: 'linear-gradient(45deg, #007AFF 30%, #5856D6 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #0056CC 30%, #4A4AC4 90%)',
            },
          }}
        >
          Dodaj Komendę
        </Button>
      </Box>

      <Grid container spacing={2}>
        {commands.map((command) => (
          <Grid item xs={12} md={6} lg={4} key={command.id}>
            <Card
              sx={{
                border: command.isActive ? '2px solid #22c55e' : '2px solid transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 'var(--shadow-lg)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DragIndicator sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Box
                      sx={{
                        fontSize: 24,
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: 1,
                        color: '#3b82f6',
                      }}
                    >
                      {iconMap[command.icon] || <Search />}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(command)}
                      sx={{ color: 'text.secondary' }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(command.id)}
                      sx={{ color: 'error.main' }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>

                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  {command.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  {command.description}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    Komenda:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.05)', p: 1, borderRadius: 1 }}>
                    {command.command}
                  </Typography>
                </Box>

                {command.agentId && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                      Agent:
                    </Typography>
                    <Chip
                      label={agents.find(a => a.id === command.agentId)?.name || command.agentId}
                      size="small"
                      sx={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
                    />
                  </Box>
                )}

                <FormControlLabel
                  control={
                    <Switch
                      checked={command.isActive}
                      onChange={() => handleToggle(command.id)}
                      color="primary"
                    />
                  }
                  label="Aktywna"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialog do edycji/dodawania komendy */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCommand ? 'Edytuj Komendę' : 'Dodaj Nową Komendę'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Tytuł"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              fullWidth
            />
            
            <TextField
              label="Opis"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Ikona</InputLabel>
              <Select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                label="Ikona"
              >
                {availableIcons.map((icon) => (
                  <MenuItem key={icon.value} value={icon.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {icon.icon}
                      {icon.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Komenda (prompt)"
              value={formData.command}
              onChange={(e) => setFormData({ ...formData, command: e.target.value })}
              fullWidth
              multiline
              rows={3}
              helperText="Tekst, który zostanie wysłany do agenta"
            />

            <FormControl fullWidth>
              <InputLabel>Agent</InputLabel>
              <Select
                value={formData.agentId}
                onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                label="Agent"
              >
                <MenuItem value="">
                  <em>Brak (ogólny)</em>
                </MenuItem>
                {agents.map((agent) => (
                  <MenuItem key={agent.id} value={agent.id}>
                    {agent.name} - {agent.description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  color="primary"
                />
              }
              label="Aktywna"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Anuluj</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.title || !formData.command}
            sx={{
              background: 'linear-gradient(45deg, #007AFF 30%, #5856D6 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #0056CC 30%, #4A4AC4 90%)',
              },
            }}
          >
            {editingCommand ? 'Zapisz' : 'Dodaj'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 
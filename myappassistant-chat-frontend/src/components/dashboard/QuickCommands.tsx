"use client";

import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  WbSunny,
  Restaurant,
  Receipt,
  Search,
  Analytics,
  CloudUpload,
} from '@mui/icons-material';
import { useChatStore } from '@/stores/chatStore';
import { useQuickCommandsStore } from '@/stores/quickCommandsStore';
import { useAgentStore } from '@/stores/agentStore';
import { weatherAPI, chatAPI, ragAPI, receiptAPI } from '@/lib/api';

// Mapowanie ikon
const iconMap: Record<string, React.ReactNode> = {
  WbSunny: <WbSunny />,
  Restaurant: <Restaurant />,
  Receipt: <Receipt />,
  Search: <Search />,
  Analytics: <Analytics />,
  CloudUpload: <CloudUpload />,
};

export function QuickCommands() {
  const theme = useTheme();
  const { addMessage } = useChatStore();
  const { getActiveCommands } = useQuickCommandsStore();
  const { agents } = useAgentStore();
  const activeCommands = getActiveCommands();

  // Dialog state
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [dialogInput, setDialogInput] = useState('');
  const [dialogFile, setDialogFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleCommandClick = async (command: any) => {
    setError(null);
    setResult(null);
    if (command.id === 'receipt' || command.id === 'upload') {
      setOpenDialog(command.id);
      return;
    }
    if (command.id === 'search') {
      setOpenDialog('search');
      return;
    }
    setLoading(true);
    addMessage({
      id: Date.now().toString(),
      content: command.command,
      role: 'user',
      timestamp: new Date(),
    });
    const targetAgent = command.agentId 
      ? agents.find(agent => agent.id === command.agentId)
      : null;
    try {
      let responseMessage = '';
      let agentType = targetAgent?.name;
      switch (command.id) {
        case 'weather': {
          const weatherResponse = await weatherAPI.getWeather('Zabki,PL');
          const weatherData = weatherResponse.data;
          responseMessage = `🌤️ **Aktualna pogoda w ${weatherData.location}:**\n\n**Temperatura:** ${weatherData.temperature}°C\n**Warunki:** ${weatherData.condition} ${weatherData.icon}\n**Wilgotność:** ${weatherData.humidity}%\n**Wiatr:** ${weatherData.windSpeed} km/h\n\n**Prognoza na 3 dni:**\n${weatherData.forecast?.map((day: any, index: number) => { const dayNames = ['Dziś', 'Jutro', 'Pojutrze']; return `• **${dayNames[index]}:** ${day.temperature.min}°C - ${day.temperature.max}°C, ${day.condition} ${day.icon}`; }).join('\n') || 'Brak danych prognostycznych'}\n\n**Ostatnia aktualizacja:** ${new Date().toLocaleTimeString('pl-PL')}`;
          agentType = targetAgent?.name || 'Agent Pogodowy';
          break;
        }
        case 'breakfast': {
          const chatResponse = await chatAPI.sendMessage({
            message: command.command,
            session_id: 'default',
            usePerplexity: false,
            useBielik: true,
            agent_states: {},
          });
          responseMessage = chatResponse.data.text || chatResponse.data.data?.reply || 'Brak odpowiedzi od AI.';
          agentType = chatResponse.data.data?.agent_type || agentType;
          break;
        }
        case 'analytics': {
          const analytics = await receiptAPI.analyzeExpenses('month');
          responseMessage = `�� **Analiza wydatków (${analytics.time_range}):**\n\n**Podsumowanie:**\n• Całkowite wydatki: ${analytics.total_expenses.toFixed(2)} zł\n• Średni dzienny wydatek: ${analytics.average_daily.toFixed(2)} zł\n\n**Top kategorie:**\n${analytics.top_categories.map((cat: any, index: number) => `${index + 1}. ${cat.name}: ${cat.amount.toFixed(2)} zł (${cat.percentage}%)`).join('\n')}\n\n**Trendy:**\n• Wydatki na jedzenie: ${analytics.trends.food_increase > 0 ? '+' : ''}${analytics.trends.food_increase}%\n• Oszczędności na transporcie: ${analytics.trends.transport_savings}%\n• Nowa kategoria: ${analytics.trends.new_category} (${analytics.trends.new_category_amount.toFixed(2)} zł)\n\n**Ostatnia aktualizacja:** ${new Date(analytics.last_updated).toLocaleString('pl-PL')}`;
          break;
        }
        default: {
          responseMessage = generateResponse(command, targetAgent);
        }
      }
      addMessage({
        id: (Date.now() + 1).toString(),
        content: responseMessage,
        role: 'assistant',
        timestamp: new Date(),
        agentType,
      });
    } catch (error: any) {
      setError(error.message || 'Błąd obsługi komendy.');
      const fallbackResponse = generateResponse(command, targetAgent);
      addMessage({
        id: (Date.now() + 1).toString(),
        content: fallbackResponse,
        role: 'assistant',
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  // Obsługa dialogów (upload/search)
  const handleDialogClose = () => {
    setOpenDialog(null);
    setDialogInput('');
    setDialogFile(null);
    setError(null);
    setResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setDialogFile(e.target.files[0]);
    }
  };

  const handleDialogSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      if (openDialog === 'receipt' && dialogFile) {
        const ocrResult = await receiptAPI.processReceipt(dialogFile);
        setResult(JSON.stringify(ocrResult, null, 2));
        addMessage({
          id: Date.now().toString(),
          content: `📄 **Wynik analizy paragonu:**\n\n${JSON.stringify(ocrResult, null, 2)}`,
          role: 'assistant',
          timestamp: new Date(),
        });
      } else if (openDialog === 'upload' && dialogFile) {
        const uploadResult = await ragAPI.uploadDocument(dialogFile);
        setResult('Plik został przesłany do bazy wiedzy.');
        addMessage({
          id: Date.now().toString(),
          content: '📁 **Plik został przesłany do bazy wiedzy.**',
          role: 'assistant',
          timestamp: new Date(),
        });
      } else if (openDialog === 'search' && dialogInput.trim()) {
        const searchResult = await ragAPI.searchDocuments(dialogInput.trim(), 5);
        setResult(JSON.stringify(searchResult.data, null, 2));
        addMessage({
          id: Date.now().toString(),
          content: `🔍 **Wyniki wyszukiwania:**\n\n${JSON.stringify(searchResult.data, null, 2)}`,
          role: 'assistant',
          timestamp: new Date(),
        });
      }
      handleDialogClose();
    } catch (err: any) {
      setError(err.message || 'Błąd operacji.');
    } finally {
      setLoading(false);
    }
  };

  const generateResponse = (command: any, agent: any) => {
    const agentInfo = agent ? `🤖 **Przekierowuję do ${agent.name}**\n\n` : '';
    switch (command.id) {
      case 'weather':
        return `${agentInfo}🌤️ **Prognoza pogody na 3 dni:**\n\nDane pogodowe nie są dostępne.`;
      case 'breakfast':
        return `${agentInfo}🍳 **Propozycje śniadania na podstawie waszej spiżarni:**\n\nBrak danych.`;
      case 'receipt':
        return `${agentInfo}📄 **Analiza paragonu**\n\nPrześlij zdjęcie paragonu.`;
      case 'search':
        return `${agentInfo}🔍 **Wyszukiwanie w bazie wiedzy**\n\nWpisz zapytanie.`;
      case 'analytics':
        return `${agentInfo}📊 **Analiza wydatków - Ostatni miesiąc**\n\nBrak danych.`;
      case 'upload':
        return `${agentInfo}📁 **Dodawanie dokumentu do bazy wiedzy**\n\nPrześlij plik.`;
      default:
        return `${agentInfo}Rozumiem! Czy mogę w czymś jeszcze pomóc?`;
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {activeCommands.map((command) => (
          <Button
            key={command.id}
            onClick={() => handleCommandClick(command)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.5,
              background: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left',
              textTransform: 'none',
              '&:hover': {
                background: 'rgba(59, 130, 246, 0.1)',
                borderColor: '#3b82f6',
                transform: 'translateY(-2px)',
                boxShadow: 'var(--shadow-md)',
              },
            }}
            disabled={loading}
          >
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
            <Box sx={{ flex: 1, textAlign: 'left' }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  mb: 0.25,
                  color: 'var(--color-text)',
                }}
              >
                {command.title}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'var(--color-text-secondary)',
                  display: 'block',
                }}
              >
                {command.description}
              </Typography>
            </Box>
            {loading && <CircularProgress size={20} />}
          </Button>
        ))}
      </Box>
      {/* Dialogs for upload/search/receipt */}
      <Dialog open={!!openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {openDialog === 'receipt' && 'Prześlij paragon do analizy'}
          {openDialog === 'upload' && 'Prześlij dokument do bazy wiedzy'}
          {openDialog === 'search' && 'Wyszukiwanie w bazie wiedzy'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {openDialog === 'search' && (
            <TextField
              label="Zapytanie do bazy wiedzy"
              value={dialogInput}
              onChange={e => setDialogInput(e.target.value)}
              fullWidth
              autoFocus
              disabled={loading}
              sx={{ mb: 2 }}
            />
          )}
          {(openDialog === 'receipt' || openDialog === 'upload') && (
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mb: 2 }}
              disabled={loading}
            >
              {dialogFile ? dialogFile.name : 'Wybierz plik'}
              <input type="file" hidden onChange={handleFileChange} />
            </Button>
          )}
          {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}
          {result && <Alert severity="success" sx={{ whiteSpace: 'pre-wrap' }}>{result}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={loading}>Anuluj</Button>
          <Button
            onClick={handleDialogSubmit}
            disabled={loading || (openDialog === 'search' && !dialogInput.trim()) || ((openDialog === 'receipt' || openDialog === 'upload') && !dialogFile)}
            variant="contained"
          >
            Wyślij
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 
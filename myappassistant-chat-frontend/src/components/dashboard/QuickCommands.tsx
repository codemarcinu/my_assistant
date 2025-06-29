"use client";

import React from 'react';
import {
  Box,
  Button,
  Typography,
  Chip,
  useTheme,
} from '@mui/material';
import {
  ShoppingCart,
  WbSunny,
  Restaurant,
  LunchDining,
  Kitchen,
} from '@mui/icons-material';
import { useChatStore } from '@/stores/chatStore';

interface QuickCommand {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: string;
  description: string;
  color: string;
}

const quickCommands: QuickCommand[] = [
  {
    id: 'shopping',
    label: 'Zrobiłem zakupy',
    icon: <ShoppingCart />,
    action: 'Zrobiłem zakupy',
    description: 'Analiza paragonów i aktualizacja spiżarni',
    color: '#007AFF',
  },
  {
    id: 'weather',
    label: 'Jaka pogoda?',
    icon: <WbSunny />,
    action: 'Jaka pogoda na dzisiaj i najbliższe 3 dni (Ząbki oraz Warszawa)',
    description: 'Prognoza pogody dla Ząbek i Warszawy',
    color: '#5856D6',
  },
  {
    id: 'breakfast',
    label: 'Co na śniadanie?',
    icon: <Restaurant />,
    action: 'Co na śniadanie?',
    description: 'Propozycje śniadaniowe na podstawie spiżarni',
    color: '#FF9500',
  },
  {
    id: 'lunch',
    label: 'Co na obiad do pracy?',
    icon: <LunchDining />,
    action: 'Co na obiad do pracy?',
    description: 'Planowanie posiłków na 3 dni',
    color: '#34C759',
  },
  {
    id: 'pantry',
    label: 'Co mam do jedzenia?',
    icon: <Kitchen />,
    action: 'Co mam do jedzenia?',
    description: 'Przegląd zawartości spiżarni',
    color: '#FF3B30',
  },
];

export function QuickCommands() {
  const theme = useTheme();
  const { addMessage } = useChatStore();

  const handleCommandClick = (command: QuickCommand) => {
    // Dodaj wiadomość użytkownika
    const userMessage = {
      id: Date.now().toString(),
      content: command.action,
      role: 'user' as const,
      timestamp: new Date(),
    };

    addMessage(userMessage);

    // Tutaj będzie logika wysyłania komendy do API
    console.log('Executing command:', command.action);
  };

  return (
    <Box 
      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
      data-testid="quick-commands"
    >
      {quickCommands.map((command) => (
        <Button
          key={command.id}
          data-testid={`quick-command-${command.id}`}
          variant="outlined"
          startIcon={command.icon}
          onClick={() => handleCommandClick(command)}
          sx={{
            justifyContent: 'flex-start',
            textAlign: 'left',
            p: 1.5,
            borderRadius: 2,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            color: 'text.primary',
            background: 'rgba(255, 255, 255, 0.02)',
            '&:hover': {
              borderColor: command.color,
              background: `${command.color}10`,
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                fontSize: '0.8rem',
                lineHeight: 1.2,
              }}
            >
              {command.label}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '0.7rem',
                lineHeight: 1.2,
                mt: 0.5,
              }}
            >
              {command.description}
            </Typography>
          </Box>
        </Button>
      ))}
    </Box>
  );
} 
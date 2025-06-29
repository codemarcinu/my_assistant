"use client";

import React from 'react';
import {
  Box,
  Button,
  Typography,
  useTheme,
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

  const handleCommandClick = (command: any) => {
    // Dodaj wiadomość użytkownika
    addMessage({
      id: Date.now().toString(),
      content: command.command,
      role: 'user',
      timestamp: new Date(),
    });

    // Znajdź odpowiedniego agenta
    const targetAgent = command.agentId 
      ? agents.find(agent => agent.id === command.agentId)
      : null;

    // Symulacja odpowiedzi AI z informacją o agencie
    setTimeout(() => {
      const response = generateResponse(command, targetAgent);
      addMessage({
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
      });
    }, 1000 + Math.random() * 2000);
  };

  const generateResponse = (command: any, agent: any) => {
    const agentInfo = agent ? `🤖 **Przekierowuję do ${agent.name}**\n\n` : '';
    
    switch (command.id) {
      case 'weather':
        return `${agentInfo}🌤️ **Prognoza pogody na 3 dni:**

**Dziś (Niedziela):**
• Ząbki: 22°C, pochmurnie z przejaśnieniami
• Warszawa: 23°C, słonecznie

**Jutro (Poniedziałek):**
• Ząbki: 19°C, deszcz po południu
• Warszawa: 20°C, lekkie opady

**Pojutrze (Wtorek):**
• Ząbki: 25°C, słonecznie
• Warszawa: 26°C, bezchmurnie

Pamiętajcie o parasolu w poniedziałek! ☂️`;

      case 'breakfast':
        return `${agentInfo}🍳 **Propozycje śniadania na podstawie waszej spiżarni:**

**Opcja 1: Omlet z warzywami**
• Jajka (2-3 sztuki)
• Brokuły (100g)
• Marchew (1 średnia, starta)
• Przyprawy według gustu

**Opcja 2: Jajecznica z ryżem**
• Jajka (2-3 sztuki)
• Ryż basmati (½ szklanki ugotowanego)
• Warzywa na patelni

Oba śniadania są pożywne i wykorzystują składniki, które macie w domu! 😊`;

      case 'receipt':
        return `${agentInfo}📄 **Analiza paragonu**

Aby przeanalizować paragon:
1. Kliknij ikonę załącznika w polu wiadomości
2. Wybierz zdjęcie paragonu
3. Poczekaj na automatyczną analizę

Mogę pomóc Ci:
• Wyodrębnić produkty i ceny
• Kategoryzować wydatki
• Dodać do bazy danych
• Wygenerować raport

Przygotuj paragon i spróbuj ponownie! 📸`;

      case 'search':
        return `${agentInfo}🔍 **Wyszukiwanie w bazie wiedzy**

Mogę przeszukać:
• Przepisy kulinarne
• Dokumenty techniczne
• Instrukcje obsługi
• Notatki i artykuły

**Przykłady wyszukiwań:**
• "przepis na ciasto czekoladowe"
• "jak naprawić drukarkę"
• "instrukcja montażu mebli"

Wpisz dokładnie czego szukasz, a znajdę najlepsze dopasowania! 📚`;

      case 'analytics':
        return `${agentInfo}📊 **Analiza wydatków - Ostatni miesiąc**

**Podsumowanie:**
• Całkowite wydatki: 2,847 zł
• Największa kategoria: Jedzenie (1,234 zł)
• Średni dzienny wydatek: 95 zł

**Top kategorie:**
1. 🍽️ Jedzenie: 1,234 zł (43%)
2. 🚗 Transport: 567 zł (20%)
3. 🏠 Rachunki: 456 zł (16%)
4. 🛒 Zakupy: 345 zł (12%)
5. 🎯 Rozrywka: 245 zł (9%)

**Trendy:**
• Wydatki na jedzenie wzrosły o 15%
• Oszczędności na transporcie: -8%
• Nowa kategoria: Elektronika (89 zł)

Chcesz zobaczyć szczegółowy raport? 📈`;

      case 'upload':
        return `${agentInfo}📁 **Dodawanie dokumentu do bazy wiedzy**

**Obsługiwane formaty:**
• PDF (do 10MB)
• JPG/PNG (zdjęcia dokumentów)
• TXT (tekst)
• DOC/DOCX (Word)

**Proces:**
1. Wybierz plik do uploadu
2. Dodaj opis/metadane
3. Automatyczna indeksacja
4. Dostępność w wyszukiwaniu

**Przykłady dokumentów:**
• Przepisy kulinarne
• Instrukcje techniczne
• Notatki z pracy
• Artykuły i poradniki

Kliknij ikonę załącznika, aby rozpocząć! 📤`;

      default:
        return `${agentInfo}Rozumiem! Czy mogę w czymś jeszcze pomóc?`;
    }
  };

  return (
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
        </Button>
      ))}
    </Box>
  );
} 
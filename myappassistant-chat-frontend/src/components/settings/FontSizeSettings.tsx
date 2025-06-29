"use client";

import React from 'react';
import {
  Box,
  Typography,
  Slider,
  FormControl,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Grid,
  Button,
  Divider,
} from '@mui/material';
import { useSettingsStore } from '@/stores/settingsStore';

export function FontSizeSettings() {
  const { 
    fontSize, 
    setFontSize, 
    darkMode, 
    toggleDarkMode,
    compactMode,
    toggleCompactMode,
    resetSettings 
  } = useSettingsStore();

  const handleFontSizeChange = (event: Event, newValue: number | number[]) => {
    setFontSize(newValue as number);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Ustawienia Wyglądu
      </Typography>

      <Grid container spacing={3}>
        {/* Rozmiar czcionki */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Rozmiar Czcionki
              </Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={fontSize}
                  onChange={handleFontSizeChange}
                  min={12}
                  max={24}
                  step={1}
                  marks={[
                    { value: 12, label: 'Mała' },
                    { value: 16, label: 'Średnia' },
                    { value: 20, label: 'Duża' },
                    { value: 24, label: 'Bardzo duża' },
                  ]}
                  valueLabelDisplay="auto"
                  sx={{
                    '& .MuiSlider-markLabel': {
                      fontSize: '0.75rem',
                    },
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                Aktualny rozmiar: {fontSize}px
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Tryb ciemny */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Tryb Ciemny
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={darkMode}
                    onChange={toggleDarkMode}
                    color="primary"
                  />
                }
                label="Włącz tryb ciemny"
              />
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                Zmienia kolory interfejsu na ciemne tło
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Tryb kompaktowy */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Tryb Kompaktowy
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={compactMode}
                    onChange={toggleCompactMode}
                    color="primary"
                  />
                }
                label="Włącz tryb kompaktowy"
              />
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                Zmniejsza odstępy między elementami
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Podgląd */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Podgląd
              </Typography>
              <Box
                sx={{
                  p: 2,
                  border: '1px solid var(--color-border)',
                  borderRadius: 1,
                  background: 'var(--color-background)',
                  fontSize: `${fontSize}px`,
                }}
              >
                <Typography variant="h4" sx={{ mb: 1 }}>
                  Przykładowy nagłówek
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  To jest przykładowy tekst z aktualnym rozmiarem czcionki. 
                  Możesz zobaczyć jak będzie wyglądał interfejs z wybranymi ustawieniami.
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Tekst pomocniczy w mniejszym rozmiarze
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Przyciski akcji */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={resetSettings}
        >
          Przywróć domyślne
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            // Zapisanie ustawień (już automatyczne przez store)
            alert('Ustawienia zostały zapisane!');
          }}
          sx={{
            background: 'linear-gradient(45deg, #007AFF 30%, #5856D6 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #0056CC 30%, #4A4AC4 90%)',
            },
          }}
        >
          Zapisz Ustawienia
        </Button>
      </Box>
    </Box>
  );
} 
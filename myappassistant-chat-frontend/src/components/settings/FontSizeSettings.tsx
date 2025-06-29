import React from 'react';
import { useFontSize, FontSize } from '../providers';
import { Box, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';

export function FontSizeSettings() {
  const { fontSize, setFontSize } = useFontSize();

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
        Rozmiar czcionki
      </Typography>
      <ToggleButtonGroup
        value={fontSize}
        exclusive
        onChange={(_, value) => value && setFontSize(value as FontSize)}
        size="small"
        color="primary"
      >
        <ToggleButton value="small">Mała</ToggleButton>
        <ToggleButton value="medium">Domyślna</ToggleButton>
        <ToggleButton value="large">Duża</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
} 
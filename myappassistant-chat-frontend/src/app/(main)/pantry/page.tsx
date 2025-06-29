import { Box, Typography, Paper } from '@mui/material';
import { Kitchen } from '@mui/icons-material';

export default function PantryPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Paper 
        sx={{ 
          p: 4, 
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Kitchen sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Zarządzanie Spiżarnią
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Funkcja zarządzania spiżarnią będzie dostępna wkrótce. Będziesz mógł śledzić produkty, daty ważności i planować posiłki.
        </Typography>
      </Paper>
    </Box>
  );
} 
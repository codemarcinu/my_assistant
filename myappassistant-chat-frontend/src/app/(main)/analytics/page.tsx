import { Box, Typography, Paper } from '@mui/material';
import { Analytics } from '@mui/icons-material';

export default function AnalyticsPage() {
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
        <Analytics sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Analityka i Raporty
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Funkcja analityki będzie dostępna wkrótce. Będziesz mógł analizować swoje nawyki żywieniowe, wydatki i efektywność zarządzania żywnością.
        </Typography>
      </Paper>
    </Box>
  );
} 
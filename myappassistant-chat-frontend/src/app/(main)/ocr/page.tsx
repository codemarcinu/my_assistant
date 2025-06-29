import { Box, Typography, Paper } from '@mui/material';
import { CameraAlt } from '@mui/icons-material';

export default function OCRPage() {
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
        <CameraAlt sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Skanowanie Paragonów
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Funkcja OCR będzie dostępna wkrótce. Będziesz mógł skanować paragony i automatycznie dodawać produkty do spiżarni.
        </Typography>
      </Paper>
    </Box>
  );
} 
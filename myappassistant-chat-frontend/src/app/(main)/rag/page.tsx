import { Box, Typography, Paper } from '@mui/material';
import { LibraryBooks } from '@mui/icons-material';

export default function RAGPage() {
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
        <LibraryBooks sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Retrieval-Augmented Generation
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Funkcja RAG będzie dostępna wkrótce. Będziesz mógł przeszukiwać dokumenty, przepisy i bazy wiedzy z zaawansowanym AI.
        </Typography>
      </Paper>
    </Box>
  );
} 
import { Box, Typography, Paper, Button, Grid, Card, CardContent } from '@mui/material';
import { LibraryBooks, Settings, Search, CloudUpload, Sync } from '@mui/icons-material';
import Link from 'next/link';

export default function RAGPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Paper 
        sx={{ 
          p: 4, 
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          mb: 4
        }}
      >
        <LibraryBooks sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Retrieval-Augmented Generation
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Zaawansowany system RAG umożliwia przeszukiwanie dokumentów, przepisów i bazy wiedzy z wykorzystaniem sztucznej inteligencji.
        </Typography>
        
        <Link href="/settings" passHref>
          <Button
            variant="contained"
            startIcon={<Settings />}
            sx={{ mr: 2 }}
          >
            Zarządzaj Bazą RAG
          </Button>
        </Link>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Search sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Wyszukiwanie Dokumentów
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Przeszukuj bazę dokumentów z zaawansowanym AI, aby znaleźć odpowiedzi na swoje pytania.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Dodawanie Dokumentów
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dodawaj nowe dokumenty do bazy wiedzy, które będą automatycznie przetwarzane przez system RAG.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Sync sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Synchronizacja Bazy
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Synchronizuj dane z paragonów, spiżarni i konwersacji z systemem RAG dla lepszych odpowiedzi.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 4, p: 3, background: 'rgba(255, 255, 255, 0.02)' }}>
        <Typography variant="h6" gutterBottom>
          Jak korzystać z systemu RAG?
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          1. Przejdź do <strong>Ustawienia → Baza RAG</strong> aby zarządzać dokumentami i synchronizować dane
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          2. Dodaj dokumenty do bazy wiedzy lub zsynchronizuj istniejące dane z aplikacji
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          3. Zadawaj pytania w czacie - system automatycznie wykorzysta bazę RAG do udzielenia odpowiedzi
        </Typography>
        <Typography variant="body2" color="text.secondary">
          4. Monitoruj statystyki i zarządzaj katalogami dokumentów w panelu ustawień
        </Typography>
      </Paper>
    </Box>
  );
} 
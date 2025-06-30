import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Grid,
} from '@mui/material';
import {
  Upload,
  Search,
  Delete,
  Description,
  Add,
} from '@mui/icons-material';
import { useRAG } from '@/hooks/useRAG';
import { ragAPI } from '@/lib/api';

export function RAGModule() {
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { searchDocuments, searchResults, progress, isSearching } = useRAG();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        await ragAPI.uploadDocument(file);
      }
      
      // Refresh documents list
      await loadDocuments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Błąd uploadu';
      setError(`Błąd przesyłania dokumentu: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await ragAPI.getDocuments();
      setDocuments(response.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Błąd ładowania';
      setError(`Błąd ładowania dokumentów: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      await searchDocuments(searchQuery);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Błąd wyszukiwania';
      setError(`Błąd wyszukiwania: ${errorMessage}`);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      // Note: This would need to be implemented in the API
      // await ragAPI.deleteDocument(documentId);
      await loadDocuments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Błąd usuwania';
      setError(`Błąd usuwania dokumentu: ${errorMessage}`);
    }
  };

  React.useEffect(() => {
    loadDocuments();
  }, []);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Zarządzanie Bazą Wiedzy (RAG)
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Upload Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Dodaj Dokumenty
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <input
                accept=".pdf,.txt,.doc,.docx"
                style={{ display: 'none' }}
                id="rag-file-upload"
                multiple
                type="file"
                onChange={handleFileUpload}
              />
              <label htmlFor="rag-file-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<Upload />}
                  disabled={uploading}
                >
                  {uploading ? 'Przesyłanie...' : 'Wybierz pliki'}
                </Button>
              </label>
              
              {uploading && <CircularProgress size={20} />}
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              Obsługiwane formaty: PDF, TXT, DOC, DOCX
            </Typography>
          </Paper>
        </Grid>

        {/* Search Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Wyszukiwanie
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Wpisz zapytanie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                disabled={isSearching}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={!searchQuery.trim() || isSearching}
                startIcon={isSearching ? <CircularProgress size={16} /> : <Search />}
              >
                Szukaj
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Documents List */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Dokumenty w Bazie ({documents.length})
              </Typography>
              <Button
                startIcon={<Add />}
                onClick={loadDocuments}
                disabled={isLoading}
              >
                Odśwież
              </Button>
            </Box>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : documents.length === 0 ? (
              <Alert severity="info">
                Brak dokumentów w bazie. Dodaj pierwszy dokument, aby rozpocząć.
              </Alert>
            ) : (
              <List>
                {documents.map((doc, index) => (
                  <React.Fragment key={doc.id || index}>
                    <ListItem>
                      <ListItemText
                        primary={doc.title || doc.name || `Dokument ${index + 1}`}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {doc.content?.substring(0, 100)}...
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Chip
                                label={doc.source || 'unknown'}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 1 }}
                              />
                              <Chip
                                label={new Date(doc.created_at || Date.now()).toLocaleDateString()}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteDocument(doc.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < documents.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Search Results */}
        {searchResults && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Wyniki Wyszukiwania ({searchResults.totalResults})
              </Typography>
              
              <List>
                {searchResults.documents.map((doc, index) => (
                  <ListItem key={doc.id}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {doc.title}
                          <Chip
                            label={`${(doc.similarity * 100).toFixed(0)}%`}
                            size="small"
                            color={doc.similarity > 0.8 ? 'success' : doc.similarity > 0.6 ? 'warning' : 'error'}
                          />
                        </Box>
                      }
                      secondary={doc.content}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
} 
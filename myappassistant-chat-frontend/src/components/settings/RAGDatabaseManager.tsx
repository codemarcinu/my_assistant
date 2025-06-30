"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Storage,
  Sync,
  Search,
  Delete,
  Add,
  Folder,
  Description,
  Refresh,
  Dataset,
  Warning,
} from '@mui/icons-material';
import { useTauriAPI } from '@/hooks/useTauriAPI';
import { useTauriContext } from '@/hooks/useTauriContext';

interface RAGDocument {
  document_id: string;
  filename: string;
  description?: string;
  tags: string[];
  directory_path: string;
  chunks_count: number;
  uploaded_at?: string;
}

interface RAGStats {
  total_documents: number;
  total_chunks: number;
  total_embeddings: number;
  storage_size_mb: number;
  last_updated: string;
  vector_store_type: string;
  embedding_model: string;
}

export function RAGDatabaseManager() {
  const { makeApiRequest } = useTauriAPI();
  const tauriContext = useTauriContext();
  const [stats, setStats] = useState<RAGStats | null>(null);
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [directories, setDirectories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncType, setSyncType] = useState<string>('all');
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [directoryDialogOpen, setDirectoryDialogOpen] = useState(false);
  const [newDirectoryPath, setNewDirectoryPath] = useState('');

  useEffect(() => {
    if (tauriContext.isInitialized) {
      loadRAGData();
    }
  }, [tauriContext.isInitialized]);

  const loadRAGData = async () => {
    setLoading(true);
    setError(null);
    
    // Check if Tauri is available
    if (!tauriContext.isAvailable) {
      setError('Tauri API nie jest dostępny w tej przeglądarce. Niektóre funkcje mogą być ograniczone.');
      setLoading(false);
      return;
    }
    
    try {
      const [statsData, documentsData, directoriesData] = await Promise.all([
        makeApiRequest('GET', '/api/v2/rag/stats'),
        makeApiRequest('GET', '/api/v2/rag/documents'),
        makeApiRequest('GET', '/api/v2/rag/directories'),
      ]);

      const statsParsed = JSON.parse(statsData);
      const documentsParsed = JSON.parse(documentsData);
      const directoriesParsed = JSON.parse(directoriesData);

      if (statsParsed.status_code === 200) {
        setStats(statsParsed.data);
      }
      if (Array.isArray(documentsParsed)) {
        setDocuments(documentsParsed);
      }
      if (Array.isArray(directoriesParsed)) {
        setDirectories(directoriesParsed);
      }
    } catch (err) {
      setError('Błąd podczas ładowania danych RAG');
      console.error('Error loading RAG data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncDatabase = async () => {
    if (!tauriContext.isAvailable) {
      setError('Funkcja synchronizacji wymaga aplikacji desktopowej.');
      return;
    }
    
    setSyncLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await makeApiRequest('POST', `/api/v2/rag/sync-database?sync_type=${syncType}`);
      const responseParsed = JSON.parse(response);
      
      if (responseParsed.status_code === 200) {
        setSuccess(`Synchronizacja zakończona pomyślnie: ${responseParsed.data.message}`);
        await loadRAGData(); // Refresh data
      } else {
        setError('Błąd podczas synchronizacji bazy danych');
      }
    } catch (err) {
      setError('Błąd podczas synchronizacji bazy danych');
      console.error('Error syncing database:', err);
    } finally {
      setSyncLoading(false);
      setSyncDialogOpen(false);
    }
  };

  const handleSearchDocuments = async () => {
    if (!searchQuery.trim()) return;
    
    if (!tauriContext.isAvailable) {
      setError('Funkcja wyszukiwania wymaga aplikacji desktopowej.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await makeApiRequest('GET', `/api/v2/rag/search?query=${encodeURIComponent(searchQuery)}&k=10`);
      const responseParsed = JSON.parse(response);
      
      if (responseParsed.status_code === 200) {
        setSearchResults(responseParsed.data.chunks || []);
      } else {
        setError('Błąd podczas wyszukiwania');
      }
    } catch (err) {
      setError('Błąd podczas wyszukiwania dokumentów');
      console.error('Error searching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDirectory = async () => {
    if (!newDirectoryPath.trim()) return;
    
    if (!tauriContext.isAvailable) {
      setError('Funkcja tworzenia katalogów wymaga aplikacji desktopowej.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await makeApiRequest('POST', `/api/v2/rag/create-directory?directory_path=${encodeURIComponent(newDirectoryPath)}`);
      const responseParsed = JSON.parse(response);
      
      if (responseParsed.status_code === 200) {
        setSuccess('Katalog został utworzony pomyślnie');
        await loadRAGData(); // Refresh directories
        setDirectoryDialogOpen(false);
        setNewDirectoryPath('');
      } else {
        setError('Błąd podczas tworzenia katalogu');
      }
    } catch (err) {
      setError('Błąd podczas tworzenia katalogu');
      console.error('Error creating directory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten dokument?')) return;
    
    if (!tauriContext.isAvailable) {
      setError('Funkcja usuwania dokumentów wymaga aplikacji desktopowej.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await makeApiRequest('DELETE', `/api/v2/rag/documents/${documentId}`);
      const responseParsed = JSON.parse(response);
      
      if (responseParsed.status_code === 200) {
        setSuccess('Dokument został usunięty pomyślnie');
        await loadRAGData(); // Refresh documents
      } else {
        setError('Błąd podczas usuwania dokumentu');
      }
    } catch (err) {
      setError('Błąd podczas usuwania dokumentu');
      console.error('Error deleting document:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDirectory = async (directoryPath: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć katalog "${directoryPath}" i wszystkie jego dokumenty?`)) return;
    
    if (!tauriContext.isAvailable) {
      setError('Funkcja usuwania katalogów wymaga aplikacji desktopowej.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await makeApiRequest('DELETE', `/api/v2/rag/directories/${encodeURIComponent(directoryPath)}`);
      const responseParsed = JSON.parse(response);
      
      if (responseParsed.status_code === 200) {
        setSuccess('Katalog został usunięty pomyślnie');
        await loadRAGData(); // Refresh data
      } else {
        setError('Błąd podczas usuwania katalogu');
      }
    } catch (err) {
      setError('Błąd podczas usuwania katalogu');
      console.error('Error deleting directory:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pl-PL');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Storage />
        Zarządzanie Bazą Danych RAG
      </Typography>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {tauriContext.isInitialized && !tauriContext.isAvailable && (
        <Alert severity="warning" sx={{ mb: 2 }} icon={<Warning />}>
          Aplikacja działa w trybie przeglądarki. Niektóre funkcje mogą być ograniczone. 
          Aby uzyskać pełną funkcjonalność, uruchom aplikację jako aplikację desktopową.
        </Alert>
      )}

      {/* Statistics Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Dataset />
            Statystyki Systemu RAG
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          ) : stats ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {stats.total_documents}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dokumenty
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {stats.total_chunks}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fragmenty
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {formatFileSize(stats.storage_size_mb * 1024 * 1024)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rozmiar
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">
                    {stats.embedding_model}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Model Embedding
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Typography color="text.secondary">Brak danych statystycznych</Typography>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<Sync />}
            onClick={() => setSyncDialogOpen(true)}
            disabled={syncLoading || !tauriContext.isAvailable}
          >
            {syncLoading ? <CircularProgress size={20} /> : 'Synchronizuj Bazę'}
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<Search />}
            onClick={() => setSearchDialogOpen(true)}
            disabled={!tauriContext.isAvailable}
          >
            Wyszukaj Dokumenty
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setDirectoryDialogOpen(true)}
            disabled={!tauriContext.isAvailable}
          >
            Utwórz Katalog
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadRAGData}
            disabled={loading || !tauriContext.isAvailable}
          >
            Odśwież
          </Button>
        </Grid>
      </Grid>

      {/* Documents and Directories */}
      <Grid container spacing={3}>
        {/* Documents Table */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Description />
                Dokumenty RAG ({documents.length})
              </Typography>
              
              {documents.length > 0 ? (
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Nazwa</TableCell>
                        <TableCell>Katalog</TableCell>
                        <TableCell>Fragmenty</TableCell>
                        <TableCell>Data</TableCell>
                        <TableCell>Akcje</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.document_id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {doc.filename}
                              </Typography>
                              {doc.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {doc.description}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={doc.directory_path}
                              size="small"
                              icon={<Folder />}
                            />
                          </TableCell>
                          <TableCell>{doc.chunks_count}</TableCell>
                          <TableCell>
                            {doc.uploaded_at ? formatDate(doc.uploaded_at) : '-'}
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Usuń dokument">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteDocument(doc.document_id)}
                                disabled={!tauriContext.isAvailable}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Brak dokumentów w bazie RAG
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Directories */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Folder />
                Katalogi ({directories.length})
              </Typography>
              
              {directories.map((directory) => (
                <Box key={directory} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Folder fontSize="small" />
                      {directory}
                    </Typography>
                    <Tooltip title="Usuń katalog">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteDirectory(directory)}
                        disabled={!tauriContext.isAvailable}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Divider sx={{ mt: 1 }} />
                </Box>
              ))}
              
              {directories.length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  Brak katalogów
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sync Database Dialog */}
      <Dialog open={syncDialogOpen} onClose={() => setSyncDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Synchronizacja Bazy Danych z RAG</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Wybierz typ danych do synchronizacji z systemem RAG:
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Typ synchronizacji</InputLabel>
            <Select
              value={syncType}
              onChange={(e) => setSyncType(e.target.value)}
              label="Typ synchronizacji"
            >
              <MenuItem value="all">Wszystkie dane</MenuItem>
              <MenuItem value="receipts">Paragony</MenuItem>
              <MenuItem value="pantry">Spiżarnia</MenuItem>
              <MenuItem value="conversations">Konwersacje</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSyncDialogOpen(false)}>Anuluj</Button>
          <Button
            onClick={handleSyncDatabase}
            variant="contained"
            disabled={syncLoading || !tauriContext.isAvailable}
          >
            {syncLoading ? <CircularProgress size={20} /> : 'Synchronizuj'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Search Documents Dialog */}
      <Dialog open={searchDialogOpen} onClose={() => setSearchDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Wyszukaj w Dokumentach RAG</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              label="Zapytanie wyszukiwania"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchDocuments()}
            />
            <Button
              variant="contained"
              onClick={handleSearchDocuments}
              disabled={loading || !searchQuery.trim() || !tauriContext.isAvailable}
            >
              {loading ? <CircularProgress size={20} /> : 'Szukaj'}
            </Button>
          </Box>
          
          {searchResults.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Wyniki wyszukiwania ({searchResults.length})
              </Typography>
              {searchResults.map((result, index) => (
                <Card key={index} sx={{ mb: 1 }}>
                  <CardContent>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {result.content}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Źródło: {result.metadata?.source || 'Nieznane'}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSearchDialogOpen(false)}>Zamknij</Button>
        </DialogActions>
      </Dialog>

      {/* Create Directory Dialog */}
      <Dialog open={directoryDialogOpen} onClose={() => setDirectoryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Utwórz Nowy Katalog RAG</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Ścieżka katalogu"
            value={newDirectoryPath}
            onChange={(e) => setNewDirectoryPath(e.target.value)}
            placeholder="np. /documents/recipes"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDirectoryDialogOpen(false)}>Anuluj</Button>
          <Button
            onClick={handleCreateDirectory}
            variant="contained"
            disabled={!newDirectoryPath.trim() || loading || !tauriContext.isAvailable}
          >
            {loading ? <CircularProgress size={20} /> : 'Utwórz'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 
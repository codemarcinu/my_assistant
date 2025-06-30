'use client';

import React from 'react';
import { Box, Typography, Button, Alert, Card, CardContent } from '@mui/material';
import { useTauriAPI } from '@/hooks/useTauriAPI';
import { useTauriContext } from '@/hooks/useTauriContext';

export function TauriTestComponent() {
  const { greet, isTauriAvailable } = useTauriAPI();
  const tauriContext = useTauriContext();
  const [greeting, setGreeting] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>('');

  const handleGreet = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await greet('Test User');
      setGreeting(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Tauri API Test
      </Typography>

      {/* Tauri Context Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tauri Context Status
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography>
              <strong>Initialized:</strong> {tauriContext.isInitialized ? 'Yes' : 'No'}
            </Typography>
            <Typography>
              <strong>Available:</strong> {tauriContext.isAvailable ? 'Yes' : 'No'}
            </Typography>
            <Typography>
              <strong>Hook Available:</strong> {isTauriAvailable ? 'Yes' : 'No'}
            </Typography>
            {tauriContext.error && (
              <Typography color="error">
                <strong>Error:</strong> {tauriContext.error}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Status Alerts */}
      {tauriContext.isInitialized && !tauriContext.isAvailable && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Tauri API is not available in this context. The app is running in web browser mode.
        </Alert>
      )}

      {tauriContext.isAvailable && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Tauri API is available and ready to use.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Test Button */}
      <Button
        variant="contained"
        onClick={handleGreet}
        disabled={loading || !tauriContext.isAvailable}
        sx={{ mb: 2 }}
      >
        {loading ? 'Testing...' : 'Test Greet Function'}
      </Button>

      {/* Result */}
      {greeting && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Greet Result:
            </Typography>
            <Typography>{greeting}</Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
} 
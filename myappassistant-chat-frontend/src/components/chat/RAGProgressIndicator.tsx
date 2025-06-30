import React from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Paper,
  Fade,
} from '@mui/material';
import { Search, Description } from '@mui/icons-material';
import { RAGProgress } from '@/hooks/useRAG';

export interface RAGProgressIndicatorProps {
  progress: RAGProgress;
  showDetails?: boolean;
  compact?: boolean;
}

export function RAGProgressIndicator({
  progress,
  showDetails = true,
  compact = false,
}: RAGProgressIndicatorProps) {
  if (progress.stage === 'idle') {
    return null;
  }

  const getStageIcon = () => {
    switch (progress.stage) {
      case 'searching':
        return <Search fontSize="small" />;
      case 'processing':
        return <Description fontSize="small" />;
      case 'complete':
        return <Description fontSize="small" />;
      case 'error':
        return <Search fontSize="small" />;
      default:
        return <Search fontSize="small" />;
    }
  };

  const getStageColor = () => {
    switch (progress.stage) {
      case 'searching':
        return 'primary';
      case 'processing':
        return 'secondary';
      case 'complete':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'primary';
    }
  };

  if (compact) {
    return (
      <Fade in={true}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {getStageIcon()}
          <Typography variant="caption" color="text.secondary">
            {progress.message}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress.progress}
            color={getStageColor()}
            sx={{ flex: 1, height: 4, borderRadius: 2 }}
          />
        </Box>
      </Fade>
    );
  }

  return (
    <Fade in={true}>
      <Paper
        sx={{
          p: 1.5,
          mb: 2,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {getStageIcon()}
          <Typography variant="body2" color="text.primary" sx={{ flex: 1 }}>
            {progress.message}
          </Typography>
          {showDetails && (
            <Typography variant="caption" color="text.secondary">
              {progress.progress}%
            </Typography>
          )}
        </Box>
        
        <LinearProgress
          variant="determinate"
          value={progress.progress}
          color={getStageColor()}
          sx={{ height: 6, borderRadius: 3 }}
        />
        
        {showDetails && progress.stage === 'complete' && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Wyszukiwanie zakończone pomyślnie
          </Typography>
        )}
        
        {showDetails && progress.stage === 'error' && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            Wystąpił błąd podczas wyszukiwania
          </Typography>
        )}
      </Paper>
    </Fade>
  );
} 
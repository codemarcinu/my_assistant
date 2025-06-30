import React from 'react';
import {
  Box,
  Alert,
  AlertTitle,
  Typography,
  IconButton,
  Button,
  Collapse,
} from '@mui/material';
import {
  Close,
  Refresh,
  Error,
  Warning,
  Info,
} from '@mui/icons-material';

export interface ErrorBannerProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  severity?: 'error' | 'warning' | 'info';
  title?: string;
  showRetry?: boolean;
  autoHide?: boolean;
  autoHideDuration?: number;
}

export function ErrorBanner({
  error,
  onRetry,
  onDismiss,
  severity = 'error',
  title,
  showRetry = true,
  autoHide = false,
  autoHideDuration = 5000,
}: ErrorBannerProps) {
  const [visible, setVisible] = React.useState(!!error);

  React.useEffect(() => {
    setVisible(!!error);
  }, [error]);

  React.useEffect(() => {
    if (autoHide && error && visible) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [autoHide, error, visible, autoHideDuration, onDismiss]);

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  const handleRetry = () => {
    onRetry?.();
  };

  if (!error || !visible) {
    return null;
  }

  const getSeverityIcon = () => {
    switch (severity) {
      case 'warning':
        return <Warning />;
      case 'info':
        return <Info />;
      default:
        return <Error />;
    }
  };

  return (
    <Collapse in={visible}>
      <Box sx={{ mb: 2 }}>
        <Alert
          severity={severity}
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {showRetry && onRetry && (
                <Button
                  size="small"
                  startIcon={<Refresh />}
                  onClick={handleRetry}
                  sx={{ minWidth: 'auto', px: 1 }}
                >
                  Spróbuj ponownie
                </Button>
              )}
              <IconButton
                size="small"
                onClick={handleDismiss}
                sx={{ p: 0.5 }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>
          }
          icon={getSeverityIcon()}
          sx={{
            borderRadius: 2,
            '& .MuiAlert-message': {
              width: '100%',
            },
          }}
        >
          {title && <AlertTitle>{title}</AlertTitle>}
          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
            {error}
          </Typography>
        </Alert>
      </Box>
    </Collapse>
  );
} 
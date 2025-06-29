"use client";

import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Paper,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  CloudUpload,
  InsertDriveFile,
  Close,
  Image,
  PictureAsPdf,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface FileUploadAreaProps {
  accept: string[];
  maxSize: number;
  onUpload: (files: File[]) => void;
  preview?: boolean;
  isUploading?: boolean;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) {
    return <Image />;
  } else if (fileType === 'application/pdf') {
    return <PictureAsPdf />;
  } else {
    return <InsertDriveFile />;
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function FileUploadArea({
  accept,
  maxSize,
  onUpload,
  preview = false,
  isUploading = false,
}: FileUploadAreaProps) {
  const theme = useTheme();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      const isValidType = accept.includes(file.type);
      const isValidSize = file.size <= maxSize;
      return isValidType && isValidSize;
    });

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter(file => {
        const isValidType = accept.includes(file.type);
        const isValidSize = file.size <= maxSize;
        return isValidType && isValidSize;
      });

      if (validFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...validFiles]);
      }
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles);
      setSelectedFiles([]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box 
      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      data-testid="file-upload-area"
    >
      {/* Upload area */}
      <Paper
        data-testid="drop-zone"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'rgba(255, 255, 255, 0.2)',
          borderRadius: 2,
          background: dragActive ? 'rgba(0, 122, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
            background: 'rgba(0, 122, 255, 0.05)',
          },
        }}
        onClick={openFileDialog}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CloudUpload
            sx={{
              fontSize: 48,
              color: dragActive ? 'primary.main' : 'text.secondary',
              mb: 2,
            }}
          />
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
            {t('upload.drag_drop')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {t('upload.formats')}: {accept.join(', ')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('upload.max_size', { maxSize: formatFileSize(maxSize) })}
          </Typography>
        </Box>
      </Paper>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept.join(',')}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        data-testid="file-input"
      />

      {/* Progress bar */}
      {isUploading && (
        <Box sx={{ width: '100%' }}>
          <LinearProgress
            data-testid="upload-progress"
            sx={{
              height: 6,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: 'linear-gradient(45deg, #007AFF 30%, #5856D6 90%)',
              },
            }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1 }}>
            Przetwarzanie plików...
          </Typography>
        </Box>
      )}

      {/* Selected files */}
      {selectedFiles.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Wybrane pliki ({selectedFiles.length}):
          </Typography>
          
          {selectedFiles.map((file, index) => (
            <Paper
              key={index}
              data-testid={`selected-file-${index}`}
              sx={{
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {getFileIcon(file.type)}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {file.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {formatFileSize(file.size)}
                </Typography>
              </Box>
              <IconButton
                data-testid={`remove-file-${index}`}
                size="small"
                onClick={() => removeFile(index)}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'error.main',
                  },
                }}
              >
                <Close />
              </IconButton>
            </Paper>
          ))}

          {/* Upload button */}
          <Button
            data-testid="upload-button"
            variant="contained"
            onClick={handleUpload}
            disabled={isUploading}
            sx={{
              mt: 1,
              background: 'linear-gradient(45deg, #007AFF 30%, #5856D6 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #0056CC 30%, #4A4AC4 90%)',
              },
            }}
          >
            {isUploading ? 'Przetwarzanie...' : 'Wyślij pliki'}
          </Button>
        </Box>
      )}
    </Box>
  );
} 
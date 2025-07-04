"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '@/lib/theme';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { ErrorBoundary } from './common/ErrorBoundary';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Providers error:', error, errorInfo);
      }}
    >
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </I18nextProvider>
    </ErrorBoundary>
  );
}

// Kontekst rozmiaru czcionki
export type FontSize = 'small' | 'medium' | 'large';
export const FontSizeContext = createContext<{
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}>({ fontSize: 'medium', setFontSize: () => {} });

export const FontSizeProvider = ({ children }: { children: ReactNode }) => {
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = () => useContext(FontSizeContext);

// Komponent kliencki do obsługi rozmiaru czcionki
export const FontSizeWrapper = ({ children }: { children: ReactNode }) => {
  const { fontSize } = useFontSize();
  let fontSizeValue = '16px';
  if (fontSize === 'small') fontSizeValue = '14px';
  if (fontSize === 'large') fontSizeValue = '20px';
  
  return (
    <div style={{ fontSize: fontSizeValue }}>
      {children}
    </div>
  );
}; 
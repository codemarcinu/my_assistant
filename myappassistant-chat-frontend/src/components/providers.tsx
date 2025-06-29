"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState, createContext, useContext, ReactNode } from "react";
import '../lib/i18n';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
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
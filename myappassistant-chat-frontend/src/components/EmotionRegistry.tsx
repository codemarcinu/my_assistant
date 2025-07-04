"use client";

import createEmotionCache from '@/lib/createEmotionCache';
import { CacheProvider } from '@emotion/react';
import { useState, useEffect } from 'react';

export function EmotionRegistry({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  const [{ cache }] = useState(() => {
    const cache = createEmotionCache();
    cache.compat = true;
    return { cache };
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render only on client side to avoid SSR issues
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <CacheProvider value={cache}>
      {children}
    </CacheProvider>
  );
} 
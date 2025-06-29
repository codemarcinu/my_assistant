"use client";

import React, { useState, useEffect } from 'react';
import { Typography, Box } from '@mui/material';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  variant?: "body1" | "body2" | "caption";
  color?: string;
}

export function TypewriterText({ 
  text, 
  speed = 30, 
  onComplete, 
  variant = "body1",
  color = "text.primary"
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  // Migający kursor
  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorTimer);
  }, []);

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
      <Typography 
        variant={variant} 
        color={color}
        sx={{ 
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: 1.5,
        }}
      >
        {displayedText}
        {showCursor && currentIndex < text.length && (
          <span style={{ 
            borderRight: '2px solid currentColor',
            animation: 'blink 1s infinite',
            marginLeft: '2px'
          }} />
        )}
      </Typography>
    </Box>
  );
} 
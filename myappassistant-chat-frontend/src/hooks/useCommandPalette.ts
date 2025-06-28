import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook for managing command palette state and keyboard shortcuts.
 * 
 * This hook provides functionality to open/close the command palette
 * and handle keyboard shortcuts (Ctrl+K / Cmd+K).
 */
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open command palette with Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(!isOpen);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return {
    isOpen,
    open,
    close,
    toggle,
    onNavigate: handleNavigate,
  };
} 
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command } from 'cmdk';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../ThemeProvider';
import { 
  Search, 
  Home, 
  ShoppingCart, 
  Settings, 
  Upload, 
  Plus,
  MessageSquare,
  Calendar,
  FileText,
  X
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords: string[];
}

/**
 * CommandPalette component for quick navigation and actions.
 * 
 * This component provides a command palette interface (Ctrl+K) for
 * quick access to various app features and navigation.
 */
export default function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const [search, setSearch] = useState('');

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const commandItems: CommandItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      subtitle: 'Przejdź do głównego panelu',
      icon: <Home className="w-4 h-4" />,
      action: () => {
        onNavigate('/');
        onClose();
      },
      keywords: ['dashboard', 'panel', 'główny', 'home', 'strona główna']
    },
    {
      id: 'pantry',
      title: 'Spiżarnia',
      subtitle: 'Zarządzaj produktami w spiżarni',
      icon: <ShoppingCart className="w-4 h-4" />,
      action: () => {
        onNavigate('/pantry');
        onClose();
      },
      keywords: ['spiżarnia', 'pantry', 'produkty', 'jedzenie', 'food']
    },
    {
      id: 'shopping',
      title: 'Lista zakupów',
      subtitle: 'Zarządzaj listą zakupów',
      icon: <FileText className="w-4 h-4" />,
      action: () => {
        onNavigate('/shopping');
        onClose();
      },
      keywords: ['zakupy', 'shopping', 'lista', 'list', 'buy']
    },
    {
      id: 'chat',
      title: 'Czat z AI',
      subtitle: 'Rozpocznij rozmowę z asystentem',
      icon: <MessageSquare className="w-4 h-4" />,
      action: () => {
        onNavigate('/chat');
        onClose();
      },
      keywords: ['czat', 'chat', 'ai', 'asystent', 'rozmowa', 'message']
    },
    {
      id: 'upload-receipt',
      title: 'Dodaj paragon',
      subtitle: 'Prześlij i przetwórz paragon',
      icon: <Upload className="w-4 h-4" />,
      action: () => {
        onNavigate('/upload');
        onClose();
      },
      keywords: ['paragon', 'receipt', 'upload', 'prześlij', 'ocr']
    },
    {
      id: 'add-product',
      title: 'Dodaj produkt',
      subtitle: 'Dodaj nowy produkt do spiżarni',
      icon: <Plus className="w-4 h-4" />,
      action: () => {
        onNavigate('/pantry?action=add');
        onClose();
      },
      keywords: ['dodaj', 'add', 'produkt', 'product', 'nowy', 'new']
    },
    {
      id: 'settings',
      title: 'Ustawienia',
      subtitle: 'Konfiguruj aplikację',
      icon: <Settings className="w-4 h-4" />,
      action: () => {
        onNavigate('/settings');
        onClose();
      },
      keywords: ['ustawienia', 'settings', 'konfiguracja', 'config']
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Command Palette */}
          <motion.div
            className="relative w-full max-w-2xl"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Command
              className={`
                w-full rounded-xl shadow-2xl border overflow-hidden
                ${resolvedTheme === 'dark' 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
                }
              `}
            >
              <div className={`
                flex items-center border-b px-4 py-3
                ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
              `}>
                <Search className={`
                  w-4 h-4 mr-3
                  ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}
                `} />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Szukaj lub wpisz komendę..."
                  className={`
                    flex-1 bg-transparent outline-none text-sm
                    ${resolvedTheme === 'dark' ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}
                  `}
                />
                <button
                  onClick={onClose}
                  className={`
                    ml-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                    ${resolvedTheme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}
                  `}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <Command.List className="max-h-96 overflow-y-auto p-2">
                <Command.Empty className={`
                  py-6 text-center text-sm
                  ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}
                `}>
                  Nie znaleziono wyników dla "{search}"
                </Command.Empty>

                {commandItems.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.id}
                    onSelect={item.action}
                    className={`
                      flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors
                      ${resolvedTheme === 'dark' 
                        ? 'text-gray-200 hover:bg-gray-700 data-[selected=true]:bg-gray-700' 
                        : 'text-gray-900 hover:bg-gray-100 data-[selected=true]:bg-gray-100'
                      }
                    `}
                  >
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-lg mr-3
                      ${resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}
                    `}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      {item.subtitle && (
                        <div className={`
                          text-xs
                          ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}
                        `}>
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.List>

              <div className={`
                flex items-center justify-between px-4 py-2 text-xs border-t
                ${resolvedTheme === 'dark' 
                  ? 'border-gray-700 text-gray-400' 
                  : 'border-gray-200 text-gray-500'
                }
              `}>
                <span>Użyj ↑↓ do nawigacji, Enter do wyboru, Esc do zamknięcia</span>
                <span>Ctrl+K</span>
              </div>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 
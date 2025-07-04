import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Settings {
  theme: 'dark' | 'light';
  language: 'pl' | 'en';
  fontSize: number;
  compactMode: boolean;
  notifications: {
    desktop: boolean;
    push: boolean;
    sound: boolean;
  };
  ai: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  rag: {
    autoIndex: boolean;
    embeddingModel: string;
    maxResults: number;
  };
  backup: {
    autoBackup: boolean;
    backupInterval: number; // w godzinach
    lastBackup: string | null;
  };
}

export interface SettingsState {
  settings: Settings;
  fontSize: number;
  darkMode: boolean;
  compactMode: boolean;
  updateSettings: (updates: Partial<Settings>) => void;
  resetSettings: () => void;
  toggleTheme: () => void;
  setFontSize: (size: number) => void;
  toggleDarkMode: () => void;
  toggleCompactMode: () => void;
  updateAISettings: (aiSettings: Partial<Settings['ai']>) => void;
  updateRAGSettings: (ragSettings: Partial<Settings['rag']>) => void;
}

const defaultSettings: Settings = {
  theme: 'dark',
  language: 'pl',
  fontSize: 16,
  compactMode: false,
  notifications: {
    desktop: true,
    push: false,
    sound: true,
  },
  ai: {
    model: 'SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0',
    temperature: 0.7,
    maxTokens: 2048,
  },
  rag: {
    autoIndex: true,
    embeddingModel: 'all-MiniLM-L6-v2',
    maxResults: 5,
  },
  backup: {
    autoBackup: true,
    backupInterval: 24,
    lastBackup: null,
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      fontSize: 16,
      darkMode: true,
      compactMode: false,

      updateSettings: (updates: Partial<Settings>) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      resetSettings: () => {
        set({ 
          settings: defaultSettings,
          fontSize: 16,
          darkMode: true,
          compactMode: false,
        });
      },

      toggleTheme: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            theme: state.settings.theme === 'dark' ? 'light' : 'dark',
          },
        }));
      },

      setFontSize: (size: number) => {
        set({ fontSize: size });
      },

      toggleDarkMode: () => {
        set((state) => ({ darkMode: !state.darkMode }));
      },

      toggleCompactMode: () => {
        set((state) => ({ compactMode: !state.compactMode }));
      },

      updateAISettings: (aiSettings: Partial<Settings['ai']>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ai: { ...state.settings.ai, ...aiSettings },
          },
        }));
      },

      updateRAGSettings: (ragSettings: Partial<Settings['rag']>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            rag: { ...state.settings.rag, ...ragSettings },
          },
        }));
      },
    }),
    {
      name: 'settings-storage',
    }
  )
); 
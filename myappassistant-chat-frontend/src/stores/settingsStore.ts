import { create } from 'zustand';

export interface Settings {
  theme: 'dark' | 'light';
  language: 'pl' | 'en';
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
  updateSettings: (updates: Partial<Settings>) => void;
  resetSettings: () => void;
  toggleTheme: () => void;
  updateAISettings: (aiSettings: Partial<Settings['ai']>) => void;
  updateRAGSettings: (ragSettings: Partial<Settings['rag']>) => void;
}

const defaultSettings: Settings = {
  theme: 'dark',
  language: 'pl',
  notifications: {
    desktop: true,
    push: false,
    sound: true,
  },
  ai: {
    model: 'gemma3:12b',
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

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,

  updateSettings: (updates: Partial<Settings>) => {
    set((state) => ({
      settings: { ...state.settings, ...updates },
    }));
  },

  resetSettings: () => {
    set({ settings: defaultSettings });
  },

  toggleTheme: () => {
    set((state) => ({
      settings: {
        ...state.settings,
        theme: state.settings.theme === 'dark' ? 'light' : 'dark',
      },
    }));
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
})); 
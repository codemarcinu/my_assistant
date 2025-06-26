// ✅ REQUIRED: Zustand store for application settings
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserSettings, AgentStatus } from '../types';

interface SettingsState {
  // User settings
  settings: UserSettings;
  
  // Agent status
  agents: AgentStatus[];
  
  // UI state
  sidebarOpen: boolean;
  currentView: string;
  
  // Actions
  updateSettings: (settings: Partial<UserSettings>) => void;
  updateAgentStatus: (agentId: string, status: Partial<AgentStatus>) => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: string) => void;
  resetSettings: () => void;
}

const defaultSettings: UserSettings = {
  theme: 'system',
  language: 'en',
  notifications: {
    email: true,
    push: true,
    telegram: false,
    expirationWarnings: true,
    lowStockAlerts: true,
  },
  integrations: {
    telegram: {
      enabled: false,
      botToken: '',
      botUsername: '',
      webhookUrl: '',
      webhookSecret: '',
      maxMessageLength: 4096,
      rateLimitPerMinute: 30,
    },
    weather: {
      enabled: true,
      location: 'Warsaw, Poland',
      units: 'metric',
    },
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      settings: defaultSettings,
      agents: [],
      sidebarOpen: true,
      currentView: 'dashboard',

      // Actions
      updateSettings: (newSettings: Partial<UserSettings>) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      updateAgentStatus: (agentId: string, status: Partial<AgentStatus>) =>
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === agentId ? { ...agent, ...status } : agent
          ),
        })),

      setSidebarOpen: (open: boolean) =>
        set({
          sidebarOpen: open,
        }),

      setCurrentView: (view: string) =>
        set({
          currentView: view,
        }),

      resetSettings: () =>
        set({
          settings: defaultSettings,
        }),
    }),
    {
      name: 'settings-store',
      partialize: (state) => ({
        settings: state.settings,
        sidebarOpen: state.sidebarOpen,
        currentView: state.currentView,
      }),
    }
  )
); 
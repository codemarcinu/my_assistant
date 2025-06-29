import { create } from 'zustand';

export interface Agent {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error' | 'busy' | 'warning';
  description: string;
  color: string;
  lastActivity: string;
  capabilities: string[];
  type: string;
  version?: string;
  error?: string;
}

export interface AgentState {
  agents: Agent[];
  activeAgent: string | null;
  setActiveAgent: (agentId: string) => void;
  updateAgentStatus: (agentId: string, status: Agent['status']) => void;
  updateAgentActivity: (agentId: string, activity: string) => void;
  setAgents: (agents: Agent[]) => void;
  toggleAgent: (agentId: string) => void;
  restartAgent: (agentId: string) => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [
    {
      id: 'ocr',
      name: 'Agent OCR',
      status: 'active',
      description: 'Przetwarzanie dokumentów i paragonów',
      color: '#007AFF',
      lastActivity: '2 min temu',
      capabilities: ['OCR', 'Analiza paragonów', 'Ekstrakcja danych'],
      type: 'OCR',
      version: '1.2.0'
    },
    {
      id: 'rag',
      name: 'Agent RAG',
      status: 'active',
      description: 'Wyszukiwanie w bazie wiedzy',
      color: '#34C759',
      lastActivity: '1 min temu',
      capabilities: ['Wyszukiwanie semantyczne', 'Baza wiedzy', 'Dokumenty'],
      type: 'RAG',
      version: '2.1.0'
    },
    {
      id: 'chef',
      name: 'Agent Kulinarny',
      status: 'idle',
      description: 'Sugestie kulinarne i przepisy',
      color: '#FF9500',
      lastActivity: '5 min temu',
      capabilities: ['Przepisy', 'Planowanie posiłków', 'Spiżarnia'],
      type: 'Chef',
      version: '1.0.5'
    },
    {
      id: 'weather',
      name: 'Agent Pogodowy',
      status: 'active',
      description: 'Informacje pogodowe',
      color: '#5856D6',
      lastActivity: '30 sek temu',
      capabilities: ['Pogoda', 'Prognozy', 'Lokalizacje'],
      type: 'Weather',
      version: '1.1.2'
    },
    {
      id: 'analytics',
      name: 'Agent Analytics',
      status: 'idle',
      description: 'Analiza wydatków i statystyk',
      color: '#FF3B30',
      lastActivity: '10 min temu',
      capabilities: ['Analiza wydatków', 'Statystyki', 'Raporty'],
      type: 'Analytics',
      version: '1.3.1'
    }
  ],
  activeAgent: null,

  setActiveAgent: (agentId: string) => {
    set({ activeAgent: agentId });
  },

  updateAgentStatus: (agentId: string, status: Agent['status']) => {
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId ? { ...agent, status } : agent
      ),
    }));
  },

  updateAgentActivity: (agentId: string, activity: string) => {
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId ? { ...agent, lastActivity: activity } : agent
      ),
    }));
  },

  setAgents: (agents: Agent[]) => {
    set({ agents });
  },

  toggleAgent: (agentId: string) => {
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId 
          ? { 
              ...agent, 
              status: agent.status === 'active' ? 'idle' : 'active',
              lastActivity: new Date().toLocaleString('pl-PL')
            } 
          : agent
      ),
    }));
  },

  restartAgent: (agentId: string) => {
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId 
          ? { 
              ...agent, 
              status: 'active',
              lastActivity: new Date().toLocaleString('pl-PL'),
              error: undefined
            } 
          : agent
      ),
    }));
  },
})); 
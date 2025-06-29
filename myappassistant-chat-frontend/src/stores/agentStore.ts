import { create } from 'zustand';

export interface Agent {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error' | 'busy';
  description: string;
  color: string;
  lastActivity: string;
  capabilities: string[];
}

export interface AgentState {
  agents: Agent[];
  activeAgent: string | null;
  setActiveAgent: (agentId: string) => void;
  updateAgentStatus: (agentId: string, status: Agent['status']) => void;
  updateAgentActivity: (agentId: string, activity: string) => void;
  setAgents: (agents: Agent[]) => void;
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
      capabilities: ['OCR', 'Analiza paragonów', 'Ekstrakcja danych']
    },
    {
      id: 'rag',
      name: 'Agent RAG',
      status: 'active',
      description: 'Wyszukiwanie w bazie wiedzy',
      color: '#34C759',
      lastActivity: '1 min temu',
      capabilities: ['Wyszukiwanie semantyczne', 'Baza wiedzy', 'Dokumenty']
    },
    {
      id: 'chef',
      name: 'Agent Kulinarny',
      status: 'idle',
      description: 'Sugestie kulinarne i przepisy',
      color: '#FF9500',
      lastActivity: '5 min temu',
      capabilities: ['Przepisy', 'Planowanie posiłków', 'Spiżarnia']
    },
    {
      id: 'weather',
      name: 'Agent Pogodowy',
      status: 'active',
      description: 'Informacje pogodowe',
      color: '#5856D6',
      lastActivity: '30 sek temu',
      capabilities: ['Pogoda', 'Prognozy', 'Lokalizacje']
    },
    {
      id: 'analytics',
      name: 'Agent Analytics',
      status: 'idle',
      description: 'Analiza wydatków i statystyk',
      color: '#FF3B30',
      lastActivity: '10 min temu',
      capabilities: ['Analiza wydatków', 'Statystyki', 'Raporty']
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
})); 
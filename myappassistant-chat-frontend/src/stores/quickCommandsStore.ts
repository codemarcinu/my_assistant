import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface QuickCommand {
  id: string;
  title: string;
  description: string;
  icon: string;
  command: string;
  agentId?: string; // ID agenta, który ma obsłużyć komendę
  isActive: boolean;
  order: number;
}

export interface QuickCommandsState {
  commands: QuickCommand[];
  addCommand: (command: Omit<QuickCommand, 'id' | 'order'>) => void;
  updateCommand: (id: string, updates: Partial<QuickCommand>) => void;
  deleteCommand: (id: string) => void;
  reorderCommands: (newOrder: string[]) => void;
  toggleCommand: (id: string) => void;
  getActiveCommands: () => QuickCommand[];
}

const defaultCommands: QuickCommand[] = [
  {
    id: 'weather',
    title: 'Sprawdź pogodę',
    description: 'Prognoza na 3 dni',
    icon: 'WbSunny',
    command: 'Jaka jest pogoda na dziś i jutro?',
    agentId: 'weather',
    isActive: true,
    order: 1,
  },
  {
    id: 'breakfast',
    title: 'Pomysły na śniadanie',
    description: 'Na podstawie spiżarni',
    icon: 'Restaurant',
    command: 'Co mogę zjeść na śniadanie z tego co mam w domu?',
    agentId: 'chef',
    isActive: true,
    order: 2,
  },
  {
    id: 'receipt',
    title: 'Analizuj paragon',
    description: 'Upload i analiza',
    icon: 'Receipt',
    command: 'Pomóż mi przeanalizować paragon',
    agentId: 'ocr',
    isActive: true,
    order: 3,
  },
  {
    id: 'search',
    title: 'Szukaj w dokumentach',
    description: 'Baza wiedzy',
    icon: 'Search',
    command: 'Szukam informacji o przepisach',
    agentId: 'rag',
    isActive: true,
    order: 4,
  },
  {
    id: 'analytics',
    title: 'Analiza wydatków',
    description: 'Statystyki i raporty',
    icon: 'Analytics',
    command: 'Pokaż mi analizę wydatków z ostatniego miesiąca',
    agentId: 'analytics',
    isActive: true,
    order: 5,
  },
  {
    id: 'upload',
    title: 'Dodaj dokument',
    description: 'Upload do bazy',
    icon: 'CloudUpload',
    command: 'Chcę dodać nowy dokument do bazy wiedzy',
    agentId: 'rag',
    isActive: true,
    order: 6,
  },
];

export const useQuickCommandsStore = create<QuickCommandsState>()(
  persist(
    (set, get) => ({
      commands: defaultCommands,

      addCommand: (command) => {
        const newCommand: QuickCommand = {
          ...command,
          id: Date.now().toString(),
          order: get().commands.length + 1,
        };
        set((state) => ({
          commands: [...state.commands, newCommand],
        }));
      },

      updateCommand: (id, updates) => {
        set((state) => ({
          commands: state.commands.map((cmd) =>
            cmd.id === id ? { ...cmd, ...updates } : cmd
          ),
        }));
      },

      deleteCommand: (id) => {
        set((state) => ({
          commands: state.commands.filter((cmd) => cmd.id !== id),
        }));
      },

      reorderCommands: (newOrder) => {
        set((state) => ({
          commands: newOrder.map((id, index) => {
            const command = state.commands.find((cmd) => cmd.id === id);
            return command ? { ...command, order: index + 1 } : command!;
          }),
        }));
      },

      toggleCommand: (id) => {
        set((state) => ({
          commands: state.commands.map((cmd) =>
            cmd.id === id ? { ...cmd, isActive: !cmd.isActive } : cmd
          ),
        }));
      },

      getActiveCommands: () => {
        return get().commands
          .filter((cmd) => cmd.isActive)
          .sort((a, b) => a.order - b.order);
      },
    }),
    {
      name: 'quick-commands-storage',
    }
  )
); 
import { create } from 'zustand';

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  activeTool: string | null;
  setActiveTool: (tool: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  activeTool: null,
  setActiveTool: (tool) => set({ activeTool: tool }),
}));
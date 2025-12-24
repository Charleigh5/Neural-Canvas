import { StateCreator } from 'zustand';
import {
  AppMode,
  UiState,
  BezelTheme,
  PresentationMode,
  ThemeConfig,
  SavedReel,
} from '../../types';

export interface UISlice {
  mode: AppMode;
  ui: UiState & { councilLogs: { msg: string; type: string; time: number }[] };
  activeTool: 'pointer' | 'hand' | 'draw';
  neuralTemperature: number;
  holidaySpirit: number;
  savedReels: SavedReel[];
  savedThemes: ThemeConfig[];
  googlePhotosToken: string | null;
  isCameraOpen: boolean;

  // Actions
  setMode: (mode: AppMode) => void;
  setBezelTheme: (theme: BezelTheme) => void;
  setSnowDensity: (density: number) => void;
  setAspectRatio: (ratio: '16:9' | '9:16') => void;
  toggleQuadMode: () => void;
  toggleCaptions: () => void;
  setPresentationMode: (mode: PresentationMode) => void;
  toggleUiPanel: (panel: keyof UiState) => void;
  setCameraOpen: (isOpen: boolean) => void;
  setGooglePhotosToken: (token: string) => void;
  addCouncilLog: (msg: string, type?: 'info' | 'warn' | 'error' | 'success') => void;
  setLiveStatus: (status: 'idle' | 'listening' | 'thinking' | 'speaking' | 'connecting') => void;
  setActiveTool: (tool: 'pointer' | 'hand' | 'draw') => void;
  saveReel: (name: string, reel: string[], overwriteId?: string) => void;
  loadReel: (id: string) => string[];
  deleteReel: (id: string) => void;
  saveTheme: (theme: ThemeConfig) => void;
}

const defaultUI: UiState & { councilLogs: { msg: string; type: string; time: number }[] } = {
  isSidebarOpen: true,
  isInspectorOpen: true,
  isTimelineOpen: true,
  isLiveActive: false,
  activePanel: 'none',
  showControlBar: true,
  showQuadView: false,
  showCaptions: false,
  presentationMode: 'flat',
  aspectRatio: '16:9',
  bezelTheme: 'standard',
  snowDensity: 50,
  liveStatus: 'idle',
  isThemeStudioOpen: false,
  toast: null,
  councilLogs: [],
};

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set, get) => ({
  mode: AppMode.HOME,
  ui: defaultUI,
  activeTool: 'pointer',
  neuralTemperature: 0,
  holidaySpirit: 0,
  savedReels: [],
  savedThemes: [],
  googlePhotosToken: null,
  isCameraOpen: false,

  setMode: mode => set({ mode }),

  setBezelTheme: theme =>
    set(state => ({
      ui: { ...state.ui, bezelTheme: theme },
    })),

  setSnowDensity: density =>
    set(state => ({
      ui: { ...state.ui, snowDensity: density },
    })),

  setAspectRatio: ratio =>
    set(state => ({
      ui: { ...state.ui, aspectRatio: ratio },
    })),

  toggleQuadMode: () =>
    set(state => ({
      ui: { ...state.ui, showQuadView: !state.ui.showQuadView },
    })),

  toggleCaptions: () =>
    set(state => ({
      ui: { ...state.ui, showCaptions: !state.ui.showCaptions },
    })),

  setPresentationMode: mode =>
    set(state => ({
      ui: { ...state.ui, presentationMode: mode },
    })),

  toggleUiPanel: panel =>
    set(state => ({
      ui: { ...state.ui, [panel]: !state.ui[panel] },
    })),

  setCameraOpen: isOpen => set({ isCameraOpen: isOpen }),

  setGooglePhotosToken: token => set({ googlePhotosToken: token }),

  addCouncilLog: (msg, type = 'info') =>
    set(state => ({
      ui: {
        ...state.ui,
        councilLogs: [{ msg, type, time: Date.now() }, ...state.ui.councilLogs].slice(0, 50),
      },
    })),

  setLiveStatus: status =>
    set(state => ({
      ui: { ...state.ui, liveStatus: status },
    })),

  setActiveTool: tool => set({ activeTool: tool }),

  saveReel: (name, reel, overwriteId) =>
    set(state => {
      const newReel: SavedReel = {
        id: overwriteId || Math.random().toString(36).substring(2, 11),
        name,
        itemIds: [...reel],
        createdAt: Date.now(),
      };

      const existingIndex = state.savedReels.findIndex(r => r.id === overwriteId);

      if (existingIndex >= 0) {
        const updated = [...state.savedReels];
        updated[existingIndex] = newReel;
        return { savedReels: updated };
      }

      return { savedReels: [...state.savedReels, newReel] };
    }),

  loadReel: id => {
    const reel = get().savedReels.find(r => r.id === id);
    return reel?.itemIds || [];
  },

  deleteReel: id =>
    set(state => ({
      savedReels: state.savedReels.filter(r => r.id !== id),
    })),

  saveTheme: theme =>
    set(state => ({
      savedThemes: [...state.savedThemes, theme],
    })),
});

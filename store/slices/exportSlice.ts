import { StateCreator } from 'zustand';
import { ExportConfig, ExportState, ExportStatus } from '../../types';

export interface ExportSlice extends ExportState {
  setExportStatus: (status: ExportStatus) => void;
  setExportProgress: (progress: number) => void;
  setExportConfig: (config: Partial<ExportConfig>) => void;
  startExport: () => void;
  finishExport: () => void;
  cancelExport: () => void;
  setError: (error: string | null) => void;
}

const defaultConfig: ExportConfig = {
  format: 'webm',
  resolution: '1080p',
  fps: 30,
  bitrate: 5000000,
};

export const createExportSlice: StateCreator<ExportSlice, [], [], ExportSlice> = set => ({
  isExporting: false,
  status: 'idle',
  progress: 0,
  currentFrame: 0,
  totalFrames: 0,
  config: defaultConfig,
  error: null,

  setExportStatus: status => set({ status }),
  setExportProgress: progress => set({ progress }),
  setExportConfig: newConfig => set(state => ({ config: { ...state.config, ...newConfig } })),

  startExport: () =>
    set({
      isExporting: true,
      status: 'rendering',
      progress: 0,
      error: null,
    }),

  finishExport: () =>
    set({
      isExporting: false,
      status: 'completed',
      progress: 100,
    }),

  cancelExport: () =>
    set({
      isExporting: false,
      status: 'idle',
      progress: 0,
      error: 'Cancelled by user',
    }),

  setError: error => set({ error, status: 'failed', isExporting: false }),
});

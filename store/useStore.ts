import { create } from 'zustand';
import {
  AppMode,
  ImageAsset,
  PlaybackConfig,
  ThemeConfig,
  UiState,
  OrchestratorState,
  SavedReel,
  BezelTheme,
  PresentationMode,
  ExportConfig,
  ExportStatus,
} from '../types';
import { createExportSlice } from './slices/exportSlice';
import {
  analyzeImage,
  editImage,
  generateThemeConfig,
  generateImage,
  generateCaption,
  curateReelSequence,
  governor,
} from '../services/geminiService';
import { resolveSpatialCollisions } from '../services/physicsEngine';
import { calculateSmartCrop } from '../utils/smartCrop';
import { resolveAssetUrl } from '../utils/assetUtils';
import { assetDB } from '../services/db';

interface StoreState {
  mode: AppMode;
  images: ImageAsset[];
  analyzedIds: Set<string>; // Idempotence Guard
  reel: string[];
  selectedIds: string[];
  playback: PlaybackConfig;
  ui: UiState & { councilLogs: { msg: string; type: string; time: number }[] };
  orchestrator: OrchestratorState;
  neuralTemperature: number;
  holidaySpirit: number;
  activeTool: 'pointer' | 'hand' | 'draw';
  forgeImageId: string | null;
  savedReels: SavedReel[];
  savedThemes: ThemeConfig[];
  processingIds: string[]; // Queue tracking
  googlePhotosToken: string | null;
  isCameraOpen: boolean;
  isAnalysisRunning: boolean;

  // Export State
  isExporting: boolean;
  status: ExportStatus;
  progress: number;
  currentFrame: number;
  totalFrames: number;
  config: ExportConfig;
  error: string | null;

  setExportStatus: (status: ExportStatus) => void;
  setExportProgress: (progress: number) => void;
  setExportConfig: (config: Partial<ExportConfig>) => void;
  startExport: () => void;
  finishExport: () => void;
  cancelExport: () => void;
  setError: (error: string | null) => void;

  // Actions
  setMode: (mode: AppMode) => void;
  addImage: (image: ImageAsset) => Promise<void>;
  updateImage: (id: string, updates: Partial<ImageAsset>) => void;
  removeImage: (id: string) => void;
  setSelectedIds: (ids: string[]) => void;
  addToReel: (ids: string[]) => void;
  removeFromReel: (id: string) => void;
  reorderReel: (newOrder: string[]) => void;
  playReel: () => void;
  playSelectedAssets: () => void;
  togglePlayback: () => void;
  nextSlide: () => void;
  prevSlide: () => void;
  setBezelTheme: (theme: BezelTheme) => void;
  setPlaybackSpeed: (speed: number) => void;
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
  setPlaybackMode: (mode: 'sequential' | 'smart-shuffle') => void;
  clearReel: () => void;

  // AI Actions
  processAnalysisQueue: () => Promise<void>;
  reanalyzeImage: (id: string) => Promise<void>;
  performUpscale: (id: string, creativity?: number) => Promise<void>;
  performImageEdit: (
    id: string,
    prompt: string,
    mode?: string,
    model?: string,
    mask?: string
  ) => Promise<void>;
  performBackgroundGeneration: (parentId: string) => Promise<void>;
  performPropGeneration: (prompt: string, parentId: string) => Promise<void>;
  applyFestiveOverdrive: (id: string, mode: string) => Promise<void>;
  performStyleTransfer: (
    id: string,
    prompt: string,
    refImage: string,
    refMime: string
  ) => Promise<void>;
  autoStyleImage: (id: string) => Promise<void>;
  resetFilters: (id: string) => void;
  duplicateImage: (id: string) => Promise<void>;
  applySmartCrop: (id: string) => void;
  resetCrop: (id: string) => void;
  applyCompositionRule: (id: string, rule: 'thirds' | 'center' | 'golden') => void;
  generateCustomTheme: (prompt: string) => Promise<void>;
  setCustomTheme: (config: ThemeConfig) => void;
  saveTheme: (config: ThemeConfig) => void;
  deleteTheme: (id: string) => void;
  saveReel: (name: string, overwriteId?: string) => void;
  loadReel: (id: string) => void;
  deleteReel: (id: string) => void;
  orchestrateReel: () => Promise<void>;
  generateCaptionsForReel: () => Promise<void>;
  setForgeImageId: (id: string | null) => void;

  // Audio Actions
  setAudioSrc: (src: string | null) => void;
  setIsAudioPlaying: (isPlaying: boolean) => void;
  setBeatSyncMode: (enabled: boolean) => void;
  setBeatMarkers: (markers: number[]) => void;

  // Batch Actions
  batchAddTags: (ids: string[], tag: string) => void;
  batchSmartCrop: (ids: string[]) => void;
  batchAnalyze: (ids: string[]) => Promise<void>;
  batchEdit: (ids: string[], prompt: string) => Promise<void>;
}

const initialPlayback: PlaybackConfig = {
  currentIndex: 0,
  speed: 5,
  isPlaying: false,
  mode: 'smart-shuffle',
  quadMode: false,
  aspectRatio: '16:9',
  bezelThickness: 20,
  bezelTheme: 'standard',
  snowDensity: 0,
  showCaptions: true,
  presentationMode: 'flat',

  // Audio defaults
  audioSrc: null,
  isAudioPlaying: false,
  beatSyncMode: false,
  beatMarkers: [],
};

const initialUi: UiState = {
  isSidebarOpen: true,
  isInspectorOpen: true,
  isTimelineOpen: true,
  isLiveActive: false,
  liveStatus: 'idle',
  activePanel: 'none',
  isThemeStudioOpen: false,
  toast: null,
  showControlBar: true,
  showQuadView: false,
  showCaptions: false,
  presentationMode: 'flat',
  aspectRatio: '16:9',
  bezelTheme: 'standard',
  snowDensity: 0,
};

// isAnalysisRunning moved to store state for proper React lifecycle management

export const useStore = create<StoreState>((set, get) => {
  // Hook up governor logging to UI
  governor.onLog = (msg, type) => get().addCouncilLog(msg, type);

  return {
    ...createExportSlice(set, get, {} as unknown as Parameters<typeof createExportSlice>[2]), // Type assertion to satisfy StateCreator signature
    mode: AppMode.HOME,
    images: [],
    analyzedIds: new Set<string>(),
    reel: [],
    selectedIds: [],
    playback: initialPlayback,
    ui: { ...initialUi, councilLogs: [] },
    orchestrator: {
      currentImageId: null,
      nextImageId: null,
      history: [],
      queue: [],
    },
    neuralTemperature: 0,
    holidaySpirit: 0,
    activeTool: 'pointer',
    forgeImageId: null,
    savedReels: [],
    savedThemes: [],
    processingIds: [],
    googlePhotosToken: null,
    isCameraOpen: false,
    isAnalysisRunning: false,

    addCouncilLog: (msg, type = 'info') =>
      set(state => ({
        ui: {
          ...state.ui,
          councilLogs: [{ msg, type, time: Date.now() }, ...state.ui.councilLogs].slice(0, 50),
        },
      })),

    setMode: mode => set({ mode }),

    setLiveStatus: status => set(state => ({ ui: { ...state.ui, liveStatus: status } })),
    setPlaybackMode: mode => set(state => ({ playback: { ...state.playback, mode } })),
    clearReel: () => set({ reel: [] }),

    addImage: async image => {
      const { images } = get();
      // 1. Idempotence Check (Global Store Level)
      if (images.some(i => i.id === image.id)) return;

      // 2. Persist to DB if it's a raw Data URI
      // If it's already 'local://', we assume it's persisted by the caller (e.g., duplicateImage)
      if (image.url.startsWith('data:')) {
        await assetDB.save(image.id, image.url);
        image.url = `local://${image.id}`;
      }

      // 3. Update State (Optimistic Add)
      set(state => {
        const newProcessing = !image.analyzed
          ? [...state.processingIds, image.id]
          : state.processingIds;

        const newAnalyzedIds = new Set(state.analyzedIds);
        if (image.analyzed) {
          newAnalyzedIds.add(image.id);
        }

        return {
          images: [...state.images, image],
          processingIds: newProcessing,
          analyzedIds: newAnalyzedIds,
        };
      });

      // 4. Trigger Async Physics (Worker Offload)
      const currentImages = get().images;
      // Run physics in background thread
      const resolvedImages = await resolveSpatialCollisions(currentImages);
      // Update with resolved positions, merging back file objects if lost (though we kept them in state)
      // We match by ID to ensure we don't overwrite newer changes if any
      set(state => ({
        images: resolvedImages.map(r => {
          const existing = state.images.find(ex => ex.id === r.id);
          return existing ? { ...existing, x: r.x, y: r.y } : r;
        }),
      }));

      // 5. Trigger Async Processor (Fire and forget)
      if (!image.analyzed) {
        get().processAnalysisQueue();
      }
    },

    processAnalysisQueue: async () => {
      if (get().isAnalysisRunning) return;
      set({ isAnalysisRunning: true });

      try {
        while (true) {
          const { processingIds, analyzedIds, images } = get();

          // Find next candidate: In processing list AND NOT in analyzed list
          const nextId = processingIds.find(id => !analyzedIds.has(id));

          if (!nextId) break; // Queue empty

          const asset = images.find(i => i.id === nextId);
          // If asset deleted while in queue, just remove from queue
          if (!asset) {
            set(s => ({
              processingIds: s.processingIds.filter(pid => pid !== nextId),
            }));
            continue;
          }

          // Execute Analysis via Governor
          set(state => ({ neuralTemperature: state.neuralTemperature + 5 })); // Mild visual feedback
          try {
            const dataUrl = await resolveAssetUrl(asset.url);
            if (dataUrl) {
              const base64 = dataUrl.split(',')[1];
              // Call wrapper - governor handles rate limits
              const analysis = await analyzeImage(base64, nextId);

              if (analysis) {
                set(state => ({
                  analyzedIds: new Set(state.analyzedIds).add(nextId),
                  images: state.images.map(img =>
                    img.id === nextId
                      ? {
                          ...img,
                          ...analysis,
                          analyzed: true,
                          cropData: analysis.composition
                            ? calculateSmartCrop(img.width, img.height)
                            : undefined,
                        }
                      : img
                  ),
                  processingIds: state.processingIds.filter(pid => pid !== nextId),
                }));
              } else {
                // If governor returned null (duplicate or skipped), remove from processing
                set(s => ({
                  processingIds: s.processingIds.filter(pid => pid !== nextId),
                }));
              }
            } else {
              // Failed to resolve URL (maybe invalid local ID)
              set(s => ({
                processingIds: s.processingIds.filter(pid => pid !== nextId),
              }));
            }
          } catch {
            // On error, we remove from processing to prevent infinite retry loop on bad assets
            // The Governor logs the error.
            set(s => ({
              processingIds: s.processingIds.filter(pid => pid !== nextId),
            }));
          } finally {
            set(state => ({
              neuralTemperature: Math.max(0, state.neuralTemperature - 5),
            }));
          }

          // Small yield to let UI breathe
          await new Promise(r => setTimeout(r, 50));
        }
      } finally {
        set({ isAnalysisRunning: false });
      }
    },

    reanalyzeImage: async id => {
      // Reset analysis state for this ID and trigger queue
      set(s => {
        const newAnalyzed = new Set(s.analyzedIds);
        newAnalyzed.delete(id);
        return {
          analyzedIds: newAnalyzed,
          processingIds: [...new Set([...s.processingIds, id])],
        };
      });
      get().processAnalysisQueue();
    },

    // --- BATCH ACTIONS ---

    batchAddTags: (ids, tag) =>
      set(state => ({
        images: state.images.map(img =>
          ids.includes(img.id)
            ? { ...img, tags: [...new Set([...img.tags, tag.toLowerCase()])] }
            : img
        ),
      })),

    batchSmartCrop: ids =>
      set(state => ({
        images: state.images.map(img =>
          ids.includes(img.id)
            ? {
                ...img,
                cropData: calculateSmartCrop(img.width, img.height, img.subjectBox),
              }
            : img
        ),
      })),

    batchAnalyze: async ids => {
      set(state => {
        const newAnalyzed = new Set(state.analyzedIds);
        const newProcessing = [...state.processingIds];

        ids.forEach(id => {
          if (state.images.some(i => i.id === id)) {
            newAnalyzed.delete(id);
            if (!newProcessing.includes(id)) newProcessing.push(id);
          }
        });

        return {
          analyzedIds: newAnalyzed,
          processingIds: newProcessing,
        };
      });
      get().processAnalysisQueue();
    },

    batchEdit: async (ids, prompt) => {
      // Fire requests sequentially but rapidly - let governor handle backpressure.
      // Additive neuralTemperature ensures UI shows processing until ALL are done.
      ids.forEach(id => {
        get().performImageEdit(id, prompt);
      });
    },

    // --- OTHER ACTIONS ---

    updateImage: (id, updates) =>
      set(state => ({
        images: state.images.map(img => (img.id === id ? { ...img, ...updates } : img)),
      })),

    removeImage: id => {
      assetDB.delete(id);
      set(state => {
        const newAnalyzed = new Set(state.analyzedIds);
        newAnalyzed.delete(id);
        return {
          images: state.images.filter(img => img.id !== id),
          analyzedIds: newAnalyzed,
          reel: state.reel.filter(rid => rid !== id),
          selectedIds: state.selectedIds.filter(sid => sid !== id),
          processingIds: state.processingIds.filter(pid => pid !== id),
        };
      });
    },

    setSelectedIds: ids => set({ selectedIds: ids }),
    addToReel: ids => set(state => ({ reel: [...new Set([...state.reel, ...ids])] })),
    removeFromReel: id => set(state => ({ reel: state.reel.filter(rid => rid !== id) })),
    reorderReel: newOrder => set({ reel: newOrder }),

    playReel: () => {
      const { reel, images } = get();
      if (reel.length === 0) return;

      // Find the first VALID image in the reel (one that exists in memory)
      let validStartId = reel.find(id => images.some(img => img.id === id));

      // Fallback: If no valid ID found (maybe images array is desynced or in process of loading),
      // optimistically pick the first ID from the reel. The view component will handle the wait/retry.
      if (!validStartId) {
        validStartId = reel[0];
        get().addCouncilLog('Attempting to play reel with pending assets...', 'warn');
      }

      set(state => ({
        mode: AppMode.PLAYER,
        playback: { ...state.playback, isPlaying: true },
        orchestrator: { ...state.orchestrator, currentImageId: validStartId },
      }));
    },

    playSelectedAssets: () => {
      const { selectedIds } = get();
      if (selectedIds.length === 0) return;
      set(state => ({
        reel: [...selectedIds],
        mode: AppMode.PLAYER,
        playback: { ...state.playback, isPlaying: true },
        orchestrator: { ...state.orchestrator, currentImageId: selectedIds[0] },
      }));
    },

    togglePlayback: () =>
      set(state => ({
        playback: { ...state.playback, isPlaying: !state.playback.isPlaying },
      })),
    nextSlide: () => {
      const { reel, orchestrator } = get();
      if (reel.length === 0) return;
      const idx = reel.indexOf(orchestrator.currentImageId || '');
      const nextId = reel[(idx + 1) % reel.length];
      set({ orchestrator: { ...orchestrator, currentImageId: nextId } });
    },
    prevSlide: () => {
      const { reel, orchestrator } = get();
      if (reel.length === 0) return;
      const idx = reel.indexOf(orchestrator.currentImageId || '');
      const prevId = reel[(idx - 1 + reel.length) % reel.length];
      set({ orchestrator: { ...orchestrator, currentImageId: prevId } });
    },

    setBezelTheme: theme => set(state => ({ playback: { ...state.playback, bezelTheme: theme } })),
    setPlaybackSpeed: speed => set(state => ({ playback: { ...state.playback, speed } })),
    setSnowDensity: density =>
      set(state => ({
        playback: { ...state.playback, snowDensity: density },
      })),
    setAspectRatio: ratio =>
      set(state => ({ playback: { ...state.playback, aspectRatio: ratio } })),
    toggleQuadMode: () =>
      set(state => ({
        playback: { ...state.playback, quadMode: !state.playback.quadMode },
      })),
    toggleCaptions: () =>
      set(state => ({
        playback: {
          ...state.playback,
          showCaptions: !state.playback.showCaptions,
        },
      })),
    setPresentationMode: mode =>
      set(state => ({
        playback: { ...state.playback, presentationMode: mode },
      })),
    toggleUiPanel: panel => set(state => ({ ui: { ...state.ui, [panel]: !state.ui[panel] } })),
    setCameraOpen: isOpen => set({ isCameraOpen: isOpen }),
    setGooglePhotosToken: token => set({ googlePhotosToken: token }),

    setAudioSrc: src => set(state => ({ playback: { ...state.playback, audioSrc: src } })),
    setIsAudioPlaying: isPlaying =>
      set(state => ({ playback: { ...state.playback, isAudioPlaying: isPlaying } })),
    setBeatSyncMode: enabled =>
      set(state => ({ playback: { ...state.playback, beatSyncMode: enabled } })),
    setBeatMarkers: markers =>
      set(state => ({ playback: { ...state.playback, beatMarkers: markers } })),

    performUpscale: async (id, _creativity) => {
      const img = get().images.find(i => i.id === id);
      if (!img) return;
      set(state => ({ neuralTemperature: state.neuralTemperature + 30 }));
      const dataUrl = await resolveAssetUrl(img.url);
      if (dataUrl) {
        const res = await editImage(
          dataUrl.split(',')[1],
          'image/jpeg',
          'Upscale to 4K resolution.',
          id
        );
        if (res) {
          const newId = `${id}_hi`;
          await get().addImage({
            ...img,
            id: newId,
            url: `data:image/jpeg;base64,${res}`,
            variantType: 'upscale',
            parentId: id,
            analyzed: true,
            x: img.x + 30,
            y: img.y + 30,
          });
        }
      }
      set(state => ({
        neuralTemperature: Math.max(0, state.neuralTemperature - 30),
      }));
    },

    performImageEdit: async (id, prompt, _mode = 'edit', _model, _mask) => {
      const img = get().images.find(i => i.id === id);
      if (!img) return;
      set(state => ({ neuralTemperature: state.neuralTemperature + 40 }));

      try {
        const dataUrl = await resolveAssetUrl(img.url);
        if (dataUrl) {
          const res = await editImage(dataUrl.split(',')[1], 'image/jpeg', prompt, id);
          if (res) {
            const newId = `${id}_fx${Date.now()}`;
            await get().addImage({
              ...img,
              id: newId,
              url: `data:image/png;base64,${res}`,
              variantType: 'edit',
              parentId: id,
              analyzed: true,
              x: img.x + 30,
              y: img.y + 30,
            });
          }
        }
      } catch {
        // Error handling handled by governor
      } finally {
        set(state => ({
          neuralTemperature: Math.max(0, state.neuralTemperature - 40),
        }));
      }
    },

    performBackgroundGeneration: async parentId => {
      set(state => ({ neuralTemperature: state.neuralTemperature + 40 }));
      const res = await generateImage('Cinematic abstract backdrop.');
      if (res) {
        const id = Math.random().toString(36).substring(2, 11);
        await get().addImage({
          id,
          url: `data:image/png;base64,${res}`,
          width: 1920,
          height: 1080,
          x: 0,
          y: 0,
          scale: 1,
          tags: ['bg', 'generated'],
          analyzed: true,
          timestamp: Date.now(),
          parentId,
          variantType: 'prop',
        });
      }
      set(state => ({
        neuralTemperature: Math.max(0, state.neuralTemperature - 40),
      }));
    },

    performPropGeneration: async (prompt, parentId) => {
      set(state => ({ neuralTemperature: state.neuralTemperature + 30 }));
      try {
        const res = await generateImage(prompt);
        if (res) {
          const id = Math.random().toString(36).substring(2, 11);
          await get().addImage({
            id,
            url: `data:image/png;base64,${res}`,
            width: 512,
            height: 512,
            x: 0,
            y: 0,
            scale: 1,
            tags: ['prop', 'generated'],
            analyzed: true,
            timestamp: Date.now(),
            parentId,
            variantType: 'prop',
          });
        }
      } finally {
        set(state => ({
          neuralTemperature: Math.max(0, state.neuralTemperature - 30),
        }));
      }
    },

    performStyleTransfer: async (id, prompt, _refImage, _refMime) => {
      set(state => ({ neuralTemperature: state.neuralTemperature + 40 }));
      try {
        const img = get().images.find(i => i.id === id);
        if (!img) return;
        const dataUrl = await resolveAssetUrl(img.url);
        if (dataUrl) {
          const res = await editImage(dataUrl.split(',')[1], 'image/jpeg', prompt, id);
          if (res) {
            const newId = `${id}_style${Date.now()}`;
            await get().addImage({
              ...img,
              id: newId,
              url: `data:image/png;base64,${res}`,
              variantType: 'variant',
              parentId: id,
              analyzed: true,
              x: img.x + 40,
              y: img.y + 40,
            });
          }
        }
      } finally {
        set(state => ({
          neuralTemperature: Math.max(0, state.neuralTemperature - 40),
        }));
      }
    },

    // --- SEMANTIC AUTO-ENHANCEMENT ---
    autoStyleImage: async id => {
      const img = get().images.find(i => i.id === id);
      if (!img) return;

      // Semantic heuristics based on neural analysis tags
      const tags = (img.tags || []).map(t => t.toLowerCase());
      const has = (words: string[]) => tags.some(t => words.some(w => t.includes(w)));

      let updates: Partial<ImageAsset> = {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        blur: 0,
        hue: 0,
        sepia: 0,
        grayscale: 0,
      };

      if (has(['night', 'dark', 'evening', 'concert', 'neon'])) {
        // Low light / High contrast look
        updates = { brightness: 15, contrast: 30, saturation: 20 };
      } else if (has(['snow', 'winter', 'ice', 'white', 'cold', 'arctic'])) {
        // Cool & Bright
        updates = { brightness: 20, contrast: 15, hue: 5, saturation: 5 };
      } else if (has(['sunset', 'sunrise', 'golden', 'sun', 'warm', 'desert'])) {
        // Warm & Vibrant
        updates = { brightness: 5, contrast: 20, saturation: 40, hue: -10 };
      } else if (has(['nature', 'forest', 'tree', 'green', 'grass', 'garden', 'plant'])) {
        // Lush
        updates = { brightness: 5, contrast: 10, saturation: 35 };
      } else if (has(['vintage', 'retro', 'old', 'nostalgia', 'sepia', 'antique'])) {
        // Aged
        updates = { sepia: 50, contrast: 10, brightness: -5, blur: 1 };
      } else if (has(['portrait', 'face', 'person', 'selfie', 'woman', 'man'])) {
        // Soft & Flattering
        updates = { brightness: 10, contrast: 5, saturation: 10, blur: 0 };
      } else if (has(['bw', 'black and white', 'monochrome', 'noir'])) {
        // Dramatic B&W
        updates = { grayscale: 100, contrast: 40, brightness: 10 };
      } else if (has(['party', 'fun', 'celebration', 'festival'])) {
        // Vibrant Pop
        updates = { brightness: 10, contrast: 20, saturation: 30 };
      } else {
        // Generic Auto-Enhance
        updates = { brightness: 8, contrast: 15, saturation: 20 };
      }

      get().updateImage(id, updates);
      get().addCouncilLog(
        `Auto-enhanced ${id.substring(0, 4)} based on semantic analysis.`,
        'info'
      );
    },

    resetFilters: id => {
      get().updateImage(id, {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        blur: 0,
        hue: 0,
        sepia: 0,
        grayscale: 0,
      });
    },

    applyFestiveOverdrive: async (id, mode) => {
      const img = get().images.find(i => i.id === id);
      if (!img) return;

      let updates: Partial<ImageAsset> = {};

      switch (mode) {
        case 'snow':
          updates = { brightness: 25, contrast: 10, hue: 15, saturation: -10 };
          break;
        case 'lights':
          updates = { brightness: -15, contrast: 50, saturation: 40, blur: 4 }; // Bokeh effect
          break;
        case 'magic':
          updates = { brightness: 10, contrast: 25, saturation: 30, hue: -15 };
          break;
      }

      get().updateImage(id, updates);
      get().addCouncilLog(`Applied festive override: ${mode}`, 'info');
    },

    duplicateImage: async id => {
      const img = get().images.find(i => i.id === id);
      if (!img) return;
      const newId = Math.random().toString(36).substring(2, 11);

      if (img.url.startsWith('local://')) {
        const oldId = img.url.replace('local://', '');
        const data = await assetDB.get(oldId);
        if (data) {
          await assetDB.save(newId, data);
          await get().addImage({
            ...img,
            id: newId,
            url: `local://${newId}`,
            parentId: id,
            variantType: 'variant',
            x: img.x + 40,
            y: img.y + 40,
          });
        }
      } else {
        await get().addImage({
          ...img,
          id: newId,
          parentId: id,
          variantType: 'variant',
          x: img.x + 40,
          y: img.y + 40,
        });
      }
    },

    applySmartCrop: id =>
      set(state => ({
        images: state.images.map(img =>
          img.id === id ? { ...img, cropData: calculateSmartCrop(img.width, img.height) } : img
        ),
      })),

    resetCrop: id =>
      set(state => ({
        images: state.images.map(img => (img.id === id ? { ...img, cropData: undefined } : img)),
      })),

    applyCompositionRule: (id, rule) =>
      set(state => ({
        images: state.images.map(img =>
          img.id === id
            ? {
                ...img,
                cropData: calculateSmartCrop(img.width, img.height, undefined, undefined, rule),
              }
            : img
        ),
      })),

    generateCustomTheme: async prompt => {
      set(state => ({ neuralTemperature: state.neuralTemperature + 20 }));
      try {
        const config = await generateThemeConfig(prompt);
        if (config)
          set(s => ({
            playback: {
              ...s.playback,
              activeThemeConfig: config,
              bezelTheme: 'custom',
            },
          }));
      } finally {
        set(state => ({
          neuralTemperature: Math.max(0, state.neuralTemperature - 20),
        }));
      }
    },

    setCustomTheme: config =>
      set(state => ({
        playback: {
          ...state.playback,
          activeThemeConfig: config,
          bezelTheme: 'custom',
        },
      })),
    saveTheme: config => set(state => ({ savedThemes: [...state.savedThemes, config] })),
    deleteTheme: id =>
      set(state => ({
        savedThemes: state.savedThemes.filter(t => t.id !== id),
      })),
    saveReel: (name: string, overwriteId) =>
      set(state => {
        const newReel = {
          id: overwriteId || Math.random().toString(36).substring(2, 11),
          name,
          itemIds: [...state.reel],
          createdAt: Date.now(),
        };
        return {
          savedReels: [...state.savedReels.filter(r => r.id !== newReel.id), newReel],
        };
      }),
    loadReel: id => {
      const r = get().savedReels.find(x => x.id === id);
      if (r) set({ reel: r.itemIds });
    },
    deleteReel: id =>
      set(state => ({
        savedReels: state.savedReels.filter(r => r.id !== id),
      })),

    orchestrateReel: async () => {
      const reelAssets = get().images.filter(i => get().reel.includes(i.id));
      if (reelAssets.length < 2) {
        get().addCouncilLog('Need at least 2 assets for orchestration', 'warn');
        return;
      }

      set(state => ({ neuralTemperature: state.neuralTemperature + 50 }));
      get().addCouncilLog('Directing Narrative Flow...', 'info');

      try {
        const curation = await curateReelSequence(reelAssets);
        if (curation && curation.sequence) {
          const newOrder = curation.sequence.map((s: { id: string }) => s.id);
          // Also apply suggested transitions/durations
          set(state => ({
            reel: newOrder,
            images: state.images.map(img => {
              const rec = curation.sequence.find((s: { id: string }) => s.id === img.id);
              return rec
                ? {
                    ...img,
                    transition: rec.transition as ImageAsset['transition'],
                    duration: rec.duration,
                  }
                : img;
            }),
          }));
          get().addCouncilLog(`Reel Orchestrated: ${curation.rationale}`, 'success');
        }
      } catch {
        get().addCouncilLog('Orchestration Failed', 'error');
      } finally {
        set(state => ({
          neuralTemperature: Math.max(0, state.neuralTemperature - 50),
        }));
      }
    },

    generateCaptionsForReel: async () => {
      const { reel, images } = get();
      if (reel.length === 0) return;

      set(state => ({ neuralTemperature: state.neuralTemperature + 20 }));
      const assets = images.filter(i => reel.includes(i.id));

      for (const asset of assets) {
        if (!asset.caption) {
          const cap = await generateCaption(asset.tags);
          if (cap) get().updateImage(asset.id, { caption: cap });
        }
      }
      set(state => ({
        neuralTemperature: Math.max(0, state.neuralTemperature - 20),
      }));
    },

    setForgeImageId: id => set({ forgeImageId: id }),
  };
});

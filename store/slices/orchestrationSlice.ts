import { StateCreator } from 'zustand';
import { ImageAsset, ThemeConfig, SavedReel } from '../../types';
import {
  editImage,
  generateImage,
  generateThemeConfig,
  generateCaption,
  curateReelSequence,
  extractAmbientContext,
  generateAmbientBackground,
} from '../../services/geminiService';
import { resolveAssetUrl } from '../../utils/assetUtils';
import { calculateSmartCrop } from '../../utils/smartCrop';
import { assetDB } from '../../services/db';

/**
 * Orchestration Slice - Handles AI-powered generation and cross-cutting actions
 * Extracted from useStore to reduce monolithic store size
 */

// Types for cross-slice access
interface ParentStoreAccess {
  images: ImageAsset[];
  reel: string[];
  savedReels: SavedReel[];
  savedThemes: ThemeConfig[];
  neuralTemperature: number;
  addImage: (image: ImageAsset) => Promise<void>;
  updateImage: (id: string, updates: Partial<ImageAsset>) => void;
  addCouncilLog: (msg: string, type?: 'info' | 'warn' | 'error' | 'success') => void;
}

export interface OrchestrationSlice {
  // AI Generation Actions
  performUpscale: (id: string, creativity: number) => Promise<void>;
  performImageEdit: (
    id: string,
    prompt: string,
    mode?: string,
    model?: string,
    mask?: string
  ) => Promise<void>;
  regenerateImageCaption: (id: string) => Promise<void>;
  performBackgroundGeneration: (parentId: string) => Promise<void>;
  performPropGeneration: (prompt: string, parentId: string) => Promise<void>;
  performStyleTransfer: (
    id: string,
    prompt: string,
    refImage?: string,
    refMime?: string
  ) => Promise<void>;

  // Auto-Enhancement Actions
  autoStyleImage: (id: string) => Promise<void>;
  resetFilters: (id: string) => void;
  applyFestiveOverdrive: (id: string, mode: 'snow' | 'lights' | 'magic') => Promise<void>;

  // Crop Actions
  applySmartCrop: (id: string) => void;
  resetCrop: (id: string) => void;
  applyCompositionRule: (id: string, rule: 'thirds' | 'golden' | 'center') => void;

  // Theme Actions
  generateCustomTheme: (prompt: string) => Promise<void>;
  setCustomTheme: (config: ThemeConfig) => void;
  saveTheme: (config: ThemeConfig) => void;
  deleteTheme: (id: string) => void;

  // Reel Actions
  saveReel: (name: string, overwriteId?: string) => void;
  loadReel: (id: string) => void;
  deleteReel: (id: string) => void;
  orchestrateReel: () => Promise<void>;
  generateCaptionsForReel: () => Promise<void>;

  // Persistence
  hydrateFromDB: () => Promise<void>;
}

export const createOrchestrationSlice: StateCreator<
  OrchestrationSlice & ParentStoreAccess,
  [],
  [],
  OrchestrationSlice
> = (set, get) => ({
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

  regenerateImageCaption: async id => {
    const img = get().images.find(i => i.id === id);
    if (!img || !img.tags.length) return;

    set(state => ({ neuralTemperature: state.neuralTemperature + 10 }));
    try {
      const caption = await generateCaption(img.tags);
      if (caption) {
        get().updateImage(id, { caption });
      }
    } catch (error) {
      get().addCouncilLog(`Caption gen failed: ${error}`, 'error');
    } finally {
      set(state => ({
        neuralTemperature: Math.max(0, state.neuralTemperature - 10),
      }));
    }
  },

  performBackgroundGeneration: async parentId => {
    set(state => ({ neuralTemperature: state.neuralTemperature + 40 }));
    try {
      const parentImage = get().images.find(i => i.id === parentId);

      let mood = 'cinematic, abstract, dreamlike';
      let colors: string[] = [];
      let tags: string[] = [];

      if (parentImage) {
        tags = parentImage.tags || [];
        colors = parentImage.colors || [];

        if (parentImage.url) {
          const dataUrl = await resolveAssetUrl(parentImage.url);
          if (dataUrl) {
            const base64 = dataUrl.split(',')[1];
            if (base64) {
              const context = await extractAmbientContext(base64, parentId);
              if (context) {
                mood = `${context.mood}, ${context.style}`;
                colors = context.colors;
              }
            }
          }
        }
      }

      const res = await generateAmbientBackground(colors, mood, tags);

      if (res) {
        const id = Math.random().toString(36).substring(2, 11);
        await get().addImage({
          id,
          url: `data:image/png;base64,${res}`,
          width: 1920,
          height: 1080,
          x: parentImage ? parentImage.x - 100 : 0,
          y: parentImage ? parentImage.y - 100 : 0,
          scale: 1.5,
          tags: ['ambient', 'background', 'generated', ...tags.slice(0, 3)],
          analyzed: true,
          timestamp: Date.now(),
          parentId,
          variantType: 'prop',
        });
      }
    } finally {
      set(state => ({
        neuralTemperature: Math.max(0, state.neuralTemperature - 40),
      }));
    }
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

  autoStyleImage: async id => {
    const img = get().images.find(i => i.id === id);
    if (!img) return;

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
      updates = { brightness: 15, contrast: 30, saturation: 20 };
    } else if (has(['snow', 'winter', 'ice', 'white', 'cold', 'arctic'])) {
      updates = { brightness: 20, contrast: 15, hue: 5, saturation: 5 };
    } else if (has(['sunset', 'sunrise', 'golden', 'sun', 'warm', 'desert'])) {
      updates = { brightness: 5, contrast: 20, saturation: 40, hue: -10 };
    } else if (has(['nature', 'forest', 'tree', 'green', 'grass', 'garden', 'plant'])) {
      updates = { brightness: 5, contrast: 10, saturation: 35 };
    } else if (has(['vintage', 'retro', 'old', 'nostalgia', 'sepia', 'antique'])) {
      updates = { sepia: 50, contrast: 10, brightness: -5, blur: 1 };
    } else if (has(['portrait', 'face', 'person', 'selfie', 'woman', 'man'])) {
      updates = { brightness: 10, contrast: 5, saturation: 10, blur: 0 };
    } else if (has(['bw', 'black and white', 'monochrome', 'noir'])) {
      updates = { grayscale: 100, contrast: 40, brightness: 10 };
    } else if (has(['party', 'fun', 'celebration', 'festival'])) {
      updates = { brightness: 10, contrast: 20, saturation: 30 };
    } else {
      updates = { brightness: 8, contrast: 15, saturation: 20 };
    }

    get().updateImage(id, updates);
    get().addCouncilLog(`Auto-enhanced ${id.substring(0, 4)} based on semantic analysis.`, 'info');
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
    let updates: Partial<ImageAsset> = {};

    switch (mode) {
      case 'snow':
        updates = { brightness: 25, contrast: 10, hue: 15, saturation: -10 };
        break;
      case 'lights':
        updates = { brightness: -15, contrast: 50, saturation: 40, blur: 4 };
        break;
      case 'magic':
        updates = { brightness: 10, contrast: 25, saturation: 30, hue: -15 };
        break;
    }

    get().updateImage(id, updates);
    get().addCouncilLog(`Applied festive override: ${mode}`, 'info');
  },

  applySmartCrop: id => {
    const img = get().images.find(i => i.id === id);
    if (img) {
      get().updateImage(id, { cropData: calculateSmartCrop(img.width, img.height) });
    }
  },

  resetCrop: id => {
    get().updateImage(id, { cropData: undefined });
  },

  applyCompositionRule: (id, rule) => {
    const img = get().images.find(i => i.id === id);
    if (img) {
      get().updateImage(id, {
        cropData: calculateSmartCrop(img.width, img.height, undefined, undefined, rule),
      });
    }
  },

  generateCustomTheme: async prompt => {
    set(state => ({ neuralTemperature: state.neuralTemperature + 20 }));
    try {
      const config = await generateThemeConfig(prompt);
      if (config) {
        // This will be handled by playback slice or UI slice
        get().addCouncilLog(`Generated theme: ${config.name}`, 'success');
      }
    } finally {
      set(state => ({
        neuralTemperature: Math.max(0, state.neuralTemperature - 20),
      }));
    }
  },

  setCustomTheme: _config => {
    // Handled by playback/UI slice
  },

  saveTheme: config => {
    set(state => ({ savedThemes: [...state.savedThemes, config] }));
    assetDB.saveTheme(config).catch(console.error);
  },

  deleteTheme: id => {
    set(state => ({
      savedThemes: state.savedThemes.filter(t => t.id !== id),
    }));
    assetDB.deleteTheme(id).catch(console.error);
  },

  saveReel: (name, overwriteId) => {
    const state = get();
    const newReel: SavedReel = {
      id: overwriteId || Math.random().toString(36).substring(2, 11),
      name,
      itemIds: [...state.reel],
      createdAt: Date.now(),
    };
    set(s => ({
      savedReels: [...s.savedReels.filter(r => r.id !== newReel.id), newReel],
    }));
    assetDB.saveReel(newReel).catch(console.error);
  },

  loadReel: id => {
    const r = get().savedReels.find(x => x.id === id);
    if (r) {
      // This sets the reel - need to use a cross-slice setter
      get().addCouncilLog(`Loaded reel: ${r.name}`, 'info');
    }
  },

  deleteReel: id => {
    set(state => ({
      savedReels: state.savedReels.filter(r => r.id !== id),
    }));
    assetDB.deleteReel(id).catch(console.error);
  },

  orchestrateReel: async () => {
    const { images, reel, addCouncilLog } = get();
    const reelAssets = images.filter(i => reel.includes(i.id));

    if (reelAssets.length < 2) {
      addCouncilLog('Need at least 2 assets for orchestration', 'warn');
      return;
    }

    set(state => ({ neuralTemperature: state.neuralTemperature + 50 }));
    addCouncilLog('AI Director: Analyzing narrative flow...', 'info');

    try {
      const curation = await curateReelSequence(reelAssets);

      if (curation && curation.sequence && curation.sequence.length > 0) {
        const newOrder = curation.sequence.map((s: { id: string }) => s.id);
        const validOrder = newOrder.filter(id => images.some(img => img.id === id));

        if (validOrder.length === 0) {
          throw new Error('AI suggested an empty or invalid sequence');
        }

        // Update images with transitions
        validOrder.forEach(imgId => {
          const rec = curation.sequence.find((s: { id: string }) => s.id === imgId);
          if (rec) {
            get().updateImage(imgId, {
              transition: rec.transition as ImageAsset['transition'],
              duration: rec.duration,
            });
          }
        });

        addCouncilLog(`Reel Orchestrated: ${curation.rationale}`, 'success');
      } else {
        throw new Error('AI returned an empty curation');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown orchestration error';
      addCouncilLog(`Orchestration Failed: ${msg}`, 'error');
      console.error('[ORCHESTRATOR] Critical Failure:', error);
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

  hydrateFromDB: async () => {
    try {
      const [savedReels, savedThemes] = await Promise.all([
        assetDB.getAllReels(),
        assetDB.getAllThemes(),
      ]);
      set({ savedReels, savedThemes });
      get().addCouncilLog(
        `Hydrated ${savedReels.length} reels, ${savedThemes.length} themes from vault`,
        'info'
      );
    } catch (error) {
      console.error('Failed to hydrate from DB:', error);
    }
  },
});

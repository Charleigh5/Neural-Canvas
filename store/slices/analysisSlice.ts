import { StateCreator } from 'zustand';
import { ImageAsset } from '../../types';
import { analyzeImage } from '../../services/geminiService';
import { resolveAssetUrl } from '../../utils/assetUtils';
import { calculateSmartCrop } from '../../utils/smartCrop';

/**
 * Analysis Slice - Handles AI-powered image analysis queue
 * Extracted from useStore to reduce monolithic store size
 */
export interface AnalysisSlice {
  // State
  analyzedIds: Set<string>;
  processingIds: string[];
  isAnalysisRunning: boolean;
  neuralTemperature: number;

  // Actions
  processAnalysisQueue: () => Promise<void>;
  reanalyzeImage: (id: string) => Promise<void>;
  batchAnalyze: (ids: string[]) => Promise<void>;
  batchAddTags: (ids: string[], tag: string) => void;
  batchSmartCrop: (ids: string[]) => void;
}

/**
 * Type for accessing parent store state during slice creation
 * This allows cross-slice access without circular dependencies
 */
interface ParentStoreAccess {
  images: ImageAsset[];
  updateImage: (id: string, updates: Partial<ImageAsset>) => void;
}

export const createAnalysisSlice: StateCreator<
  AnalysisSlice & ParentStoreAccess,
  [],
  [],
  AnalysisSlice
> = (set, get) => ({
  analyzedIds: new Set<string>(),
  processingIds: [],
  isAnalysisRunning: false,
  neuralTemperature: 0,

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
        set(state => ({ neuralTemperature: state.neuralTemperature + 5 }));
        try {
          const dataUrl = await resolveAssetUrl(asset.url);
          if (dataUrl) {
            const base64 = dataUrl.split(',')[1];
            const analysis = await analyzeImage(base64, nextId);

            if (analysis) {
              set(state => ({
                analyzedIds: new Set(state.analyzedIds).add(nextId),
                processingIds: state.processingIds.filter(pid => pid !== nextId),
              }));
              // Update image via parent store action
              get().updateImage(nextId, {
                ...analysis,
                analyzed: true,
                cropData: analysis.composition
                  ? calculateSmartCrop(asset.width, asset.height)
                  : undefined,
              });
            } else {
              set(s => ({
                processingIds: s.processingIds.filter(pid => pid !== nextId),
              }));
            }
          } else {
            set(s => ({
              processingIds: s.processingIds.filter(pid => pid !== nextId),
            }));
          }
        } catch {
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

  batchAnalyze: async ids => {
    const { images } = get();
    set(state => {
      const newAnalyzed = new Set(state.analyzedIds);
      const newProcessing = [...state.processingIds];

      ids.forEach(id => {
        if (images.some(i => i.id === id)) {
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

  batchAddTags: (ids, tag) => {
    const { images, updateImage } = get();
    ids.forEach(id => {
      const img = images.find(i => i.id === id);
      if (img) {
        updateImage(id, { tags: [...new Set([...img.tags, tag.toLowerCase()])] });
      }
    });
  },

  batchSmartCrop: ids => {
    const { images, updateImage } = get();
    ids.forEach(id => {
      const img = images.find(i => i.id === id);
      if (img) {
        updateImage(id, {
          cropData: calculateSmartCrop(img.width, img.height, img.subjectBox),
        });
      }
    });
  },
});

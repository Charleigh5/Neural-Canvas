import { StateCreator } from 'zustand';
import { ImageAsset } from '../../types';
import { assetDB } from '../../services/db';

export interface ImageSlice {
  images: ImageAsset[];
  analyzedIds: Set<string>;
  selectedIds: string[];
  forgeImageId: string | null;
  processingIds: string[];
  isAnalysisRunning: boolean;

  // Actions
  addImage: (image: ImageAsset) => Promise<void>;
  updateImage: (id: string, updates: Partial<ImageAsset>) => void;
  removeImage: (id: string) => void;
  setSelectedIds: (ids: string[]) => void;
  setForgeImageId: (id: string | null) => void;
  duplicateImage: (id: string) => Promise<void>;
}

export const createImageSlice: StateCreator<ImageSlice, [], [], ImageSlice> = (set, get) => ({
  images: [],
  analyzedIds: new Set(),
  selectedIds: [],
  forgeImageId: null,
  processingIds: [],
  isAnalysisRunning: false,

  addImage: async (image) => {
    // Store binary data in IndexedDB if it's a Data URL
    if (image.url.startsWith('data:')) {
      await assetDB.save(image.id, image.url);
      image = { ...image, url: `local://${image.id}` };
    }

    set((state) => ({
      images: [...state.images, image],
      processingIds: [...state.processingIds, image.id],
    }));
  },

  updateImage: (id, updates) =>
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id ? { ...img, ...updates } : img
      ),
    })),

  removeImage: (id) =>
    set((state) => {
      // Clean up from IndexedDB
      assetDB.delete(id).catch(console.error);
      return {
        images: state.images.filter((img) => img.id !== id),
        selectedIds: state.selectedIds.filter((sid) => sid !== id),
      };
    }),

  setSelectedIds: (ids) => set({ selectedIds: ids }),

  setForgeImageId: (id) => set({ forgeImageId: id }),

  duplicateImage: async (id) => {
    const img = get().images.find((i) => i.id === id);
    if (!img) return;

    const newId = Math.random().toString(36).substring(2, 11);

    if (img.url.startsWith('local://')) {
      const oldId = img.url.replace('local://', '');
      const data = await assetDB.get(oldId);
      if (data) {
        await assetDB.save(newId, data);
      }
    }

    const newImage: ImageAsset = {
      ...img,
      id: newId,
      url: img.url.startsWith('local://') ? `local://${newId}` : img.url,
      x: (img.x || 0) + 50,
      y: (img.y || 0) + 50,
    };

    set((state) => ({
      images: [...state.images, newImage],
    }));
  },
});

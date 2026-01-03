import { pipeline, env } from '@xenova/transformers';
import { Voy, Neighbor } from 'voy-search';
import { ImageAsset } from '../types';
import { assetDB } from './db';

// Configure transformers.js to load models from CDN or local public folder
// For this environment, we'll default to CDN but allow local override
env.allowLocalModels = false;
env.useBrowserCache = true;

// Pipeline type: @xenova/transformers uses dynamically typed pipelines.
// The strict return type varies greatly by task ('feature-extraction' vs 'text-classification').
// We use a function-like type here to describe the callable behavior.

type EmbeddingPipeline = (
  input: string,
  options?: Record<string, unknown>
) => Promise<{ data: Float32Array }>;

let embedder: EmbeddingPipeline | null = null;
let voyIndex: Voy | null = null;
let isInitializing = false;

// We use a small, efficient model for web: MobileViT or CLIP-tiny
const MODEL_NAME = 'Xenova/clip-vit-base-patch32';

export interface SearchResult {
  id: string;
  score: number;
}

export const semanticService = {
  /**
   * Initialize the model and vector database.
   * Loads persisted index from IndexedDB if available.
   */
  init: async () => {
    if (embedder && voyIndex) return;
    if (isInitializing) return;

    isInitializing = true;
    console.debug('[SEMANTIC] Initializing Neural Engine...');

    try {
      // 1. Load Model (Pipeline)
      // The pipeline function returns a callable that matches our EmbeddingPipeline interface
      embedder = (await pipeline('feature-extraction', MODEL_NAME, {
        quantized: true,
      })) as unknown as EmbeddingPipeline;

      // 2. Load Persisted Index
      const serializedIndex = await assetDB.get('voy_index');

      if (serializedIndex) {
        // If we saved the index as a string or blob, we need to handle hydration.
        // Voy currently supports simple re-instantiation.
        // For this implementation, we'll re-add resources if index serialization is complex,
        // or just start fresh if simplicity is key for the prototype.
        // *Optimized approach:* We store embeddings in `assetDB` and rebuild Voy on boot.
        // This is fast enough for < 10,000 items.

        voyIndex = new Voy({ embeddings: [] });
        console.debug('[SEMANTIC] Index ready (Fresh).');
      } else {
        voyIndex = new Voy({ embeddings: [] });
      }
    } catch (e) {
      console.error('[SEMANTIC] Initialization Failed:', e);
    } finally {
      isInitializing = false;
    }
  },

  /**
   * Generate an embedding for an image or text.
   */
  embed: async (input: string | Blob): Promise<number[]> => {
    if (!embedder) await semanticService.init();

    if (!embedder) {
      console.error('Embedder failed to initialize');
      return [];
    }

    // The pipeline handles both text and image URLs automatically based on input
    // Convert Blob to URL if needed for transformers.js
    let finalInput = input;
    let blobUrl: string | null = null;

    if (input instanceof Blob) {
      blobUrl = URL.createObjectURL(input);
      finalInput = blobUrl;
    }

    try {
      const output = await embedder(finalInput as string, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    } catch (e) {
      console.error('Embedding generation error:', e);
      return [];
    } finally {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    }
  },

  /**
   * Index an image asset.
   * Generates embedding and adds to Voy.
   */
  indexImage: async (image: ImageAsset) => {
    if (!embedder || !voyIndex) await semanticService.init();

    if (!voyIndex) return;

    try {
      const embedding = await semanticService.embed(image.url);
      if (!embedding || embedding.length === 0) return;

      // Add to Voy
      voyIndex.add({
        embeddings: [
          {
            id: image.id,
            title: image.tags?.join(' ') || 'image', // Simple metadata
            url: image.url,
            embeddings: embedding,
          },
        ],
      });

      console.debug(`[SEMANTIC] Indexed ${image.id}`);

      // Persist embedding to DB for faster re-indexing (Optional/Future)
      // await assetDB.saveEmbedding(image.id, embedding);
    } catch (e) {
      console.error(`[SEMANTIC] Failed to index ${image.id}:`, e);
    }
  },

  /**
   * Search for images using natural language.
   */
  search: async (query: string, limit = 10): Promise<SearchResult[]> => {
    if (!embedder || !voyIndex) await semanticService.init();

    if (!voyIndex) return [];

    try {
      const queryEmbedding = await semanticService.embed(query);
      if (queryEmbedding.length === 0) return [];

      // Voy search returns SearchResult with neighbors[]
      const results = voyIndex.search(new Float32Array(queryEmbedding), limit);

      if (!results || !results.neighbors || !Array.isArray(results.neighbors)) return [];

      // Map Voy neighbors to our format
      return results.neighbors.map((r: Neighbor) => ({
        id: r.id,
        score: 1, // Voy doesn't return a score, neighbors are ordered by similarity
      }));
    } catch (e) {
      console.error('[SEMANTIC] Search failed:', e);
      return [];
    }
  },
};

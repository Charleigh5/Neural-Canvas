/**
 * localClassificationService.ts
 *
 * Browser-based zero-shot image classification using CLIP.
 * Provides instant tags without network latency.
 *
 * Based on Transformers.js CLIP implementation:
 * https://huggingface.co/Xenova/clip-vit-base-patch32
 */

import {
  AutoProcessor,
  AutoTokenizer,
  CLIPVisionModelWithProjection,
  CLIPTextModelWithProjection,
  RawImage,
   
} from '@xenova/transformers';

// --- CLASSIFICATION LABELS ---
// Curated set of ~60 common labels for general-purpose image classification
export const CLASSIFICATION_LABELS = [
  // People & Portraits
  'person',
  'portrait',
  'selfie',
  'group photo',
  'family',
  'baby',
  'child',
  'couple',

  // Nature & Landscapes
  'landscape',
  'mountain',
  'beach',
  'ocean',
  'forest',
  'sunset',
  'sunrise',
  'sky',
  'clouds',
  'snow',
  'rain',
  'flowers',
  'garden',

  // Animals
  'dog',
  'cat',
  'pet',
  'bird',
  'wildlife',

  // Food & Drink
  'food',
  'meal',
  'dessert',
  'drink',
  'coffee',

  // Activities & Events
  'celebration',
  'party',
  'wedding',
  'birthday',
  'holiday',
  'christmas',
  'travel',
  'vacation',
  'sports',
  'concert',

  // Places & Architecture
  'city',
  'building',
  'architecture',
  'street',
  'interior',
  'home',

  // Objects & Art
  'art',
  'abstract',
  'product',
  'vehicle',
  'car',

  // Style & Mood
  'vintage',
  'black and white',
  'colorful',
  'minimalist',
  'night',
];

// --- SERVICE STATE ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let processor: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let visionModel: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let textModel: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tokenizer: any = null;
let isInitializing = false;
let isInitialized = false;

// Pre-computed text embeddings for labels (cached after first use)
let labelEmbeddings: Float32Array[] | null = null;

const MODEL_NAME = 'Xenova/clip-vit-base-patch32';

export interface ClassificationResult {
  tags: string[];
  confidence: Record<string, number>;
}

/**
 * Compute softmax probabilities from logits
 */
function softmax(logits: number[]): number[] {
  const maxLogit = Math.max(...logits);
  const exps = logits.map(l => Math.exp(l - maxLogit));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sumExps);
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const localClassificationService = {
  /**
   * Initialize the CLIP model components.
   * Should be called early (e.g., on app start) to preload models.
   */
  init: async (): Promise<void> => {
    if (isInitialized || isInitializing) return;

    isInitializing = true;
    console.debug('[LOCAL_CLASSIFY] Initializing CLIP model...');

    try {
      // Load all CLIP components in parallel
      const [proc, vision, text, tok] = await Promise.all([
        AutoProcessor.from_pretrained(MODEL_NAME),
        CLIPVisionModelWithProjection.from_pretrained(MODEL_NAME),
        CLIPTextModelWithProjection.from_pretrained(MODEL_NAME),
        AutoTokenizer.from_pretrained(MODEL_NAME),
      ]);

      processor = proc;
      visionModel = vision;
      textModel = text;
      tokenizer = tok;

      // Pre-compute text embeddings for all labels
      console.debug('[LOCAL_CLASSIFY] Pre-computing label embeddings...');
      labelEmbeddings =
        await localClassificationService.computeLabelEmbeddings(CLASSIFICATION_LABELS);

      isInitialized = true;
      console.debug('[LOCAL_CLASSIFY] Model ready.');
    } catch (e) {
      console.error('[LOCAL_CLASSIFY] Initialization failed:', e);
    } finally {
      isInitializing = false;
    }
  },

  /**
   * Pre-compute embeddings for a list of text labels.
   */
  computeLabelEmbeddings: async (labels: string[]): Promise<Float32Array[]> => {
    if (!tokenizer || !textModel) {
      throw new Error('Models not initialized');
    }

    const embeddings: Float32Array[] = [];

    for (const label of labels) {
      // CLIP works better with "a photo of {label}" prefix
      const text = `a photo of ${label}`;
      const textInputs = tokenizer(text, { padding: true, truncation: true });
      const textOutputs = await textModel(textInputs);

      // Extract the embedding - handle different output formats
      const embedding = textOutputs.text_embeds?.data || textOutputs.last_hidden_state?.data;
      if (embedding) {
        embeddings.push(new Float32Array(embedding));
      }
    }

    return embeddings;
  },

  /**
   * Classify an image against the predefined labels.
   * Returns top-k tags with confidence scores.
   *
   * @param imageUrl - URL or data URL of the image
   * @param topK - Number of top tags to return (default: 5)
   */
  classifyImage: async (imageUrl: string, topK: number = 5): Promise<ClassificationResult> => {
    // Ensure initialization
    if (!isInitialized) {
      await localClassificationService.init();
    }

    if (!processor || !visionModel || !labelEmbeddings) {
      console.warn('[LOCAL_CLASSIFY] Models not available');
      return { tags: [], confidence: {} };
    }

    try {
      // Load and process the image
      const image = await RawImage.read(imageUrl);
      const imageInputs = await processor(image);

      // Generate image embeddings
      const imageOutputs = await visionModel(imageInputs);
      const imageEmbedding =
        imageOutputs.image_embeds?.data || imageOutputs.last_hidden_state?.data;

      if (!imageEmbedding) {
        console.warn('[LOCAL_CLASSIFY] No image embedding generated');
        return { tags: [], confidence: {} };
      }

      const imageEmbed = new Float32Array(imageEmbedding);

      // Compute similarities with all label embeddings
      const similarities: number[] = [];
      for (const labelEmbed of labelEmbeddings) {
        const sim = cosineSimilarity(imageEmbed, labelEmbed);
        similarities.push(sim);
      }

      // Convert to probabilities using softmax with temperature scaling
      const temperature = 0.07; // CLIP default temperature
      const scaledSims = similarities.map(s => s / temperature);
      const probabilities = softmax(scaledSims);

      // Create label -> probability mapping
      const confidence: Record<string, number> = {};
      CLASSIFICATION_LABELS.forEach((label, i) => {
        confidence[label] = probabilities[i];
      });

      // Sort and get top-k
      const sorted = CLASSIFICATION_LABELS.map((label, i) => ({
        label,
        prob: probabilities[i],
      })).sort((a, b) => b.prob - a.prob);

      const topTags = sorted.slice(0, topK).map(x => x.label);

      console.debug(
        `[LOCAL_CLASSIFY] Top tags: ${topTags.map((t, i) => `${t} (${(sorted[i].prob * 100).toFixed(1)}%)`).join(', ')}`
      );

      return { tags: topTags, confidence };
    } catch (e) {
      console.error('[LOCAL_CLASSIFY] Classification failed:', e);
      return { tags: [], confidence: {} };
    }
  },

  /**
   * Check if the service is ready
   */
  isReady: (): boolean => isInitialized,

  /**
   * Check if the service is currently loading
   */
  isLoading: (): boolean => isInitializing,
};

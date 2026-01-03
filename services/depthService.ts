/**
 * Depth Service - AI-powered depth map generation using Depth-Anything model
 *
 * Uses @xenova/transformers for browser-based ML inference.
 * Model is lazily loaded on first use to avoid blocking app startup.
 */

import { pipeline, env, RawImage } from '@xenova/transformers';

// Configure transformers.js for browser
env.allowLocalModels = false;
env.useBrowserCache = true;

// Model configuration
const MODEL_ID = 'Xenova/depth-anything-small-hf';
const MAX_DIMENSION = 518; // Model's expected size

// Type for depth estimation pipeline (the library's types are complex)
type DepthPipeline = (
  image: RawImage,
  options?: Record<string, unknown>
) => Promise<{ predicted_depth: { toCanvas: () => HTMLCanvasElement } }>;

// Lazy-loaded pipeline instance
let depthPipeline: DepthPipeline | null = null;
let isLoading = false;
let loadError: Error | null = null;

/**
 * Initialize the depth estimation pipeline
 * Called lazily on first depth map request
 */
async function initPipeline(): Promise<DepthPipeline> {
  if (depthPipeline) return depthPipeline;
  if (loadError) throw loadError;

  if (isLoading) {
    // Wait for existing load to complete
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (depthPipeline) return depthPipeline;
    if (loadError) throw loadError;
  }

  isLoading = true;
  try {
    console.debug('[DepthService] Loading depth model...');
    const loadedPipeline = await pipeline('depth-estimation', MODEL_ID, {
      progress_callback: (progress: { status: string; progress?: number }) => {
        if (progress.progress) {
          console.debug(`[DepthService] Model loading: ${Math.round(progress.progress)}%`);
        }
      },
    });
    // Cast to our simplified type
    depthPipeline = loadedPipeline as unknown as DepthPipeline;
    console.debug('[DepthService] Depth model loaded successfully');
    return depthPipeline;
  } catch (error) {
    loadError = error instanceof Error ? error : new Error('Failed to load depth model');
    console.error('[DepthService] Failed to load depth model:', error);
    throw loadError;
  } finally {
    isLoading = false;
  }
}

/**
 * Generate a depth map from an image URL
 * @param imageUrl - Data URL or blob URL of the source image
 * @returns Base64-encoded grayscale depth map image
 */
export async function generateDepthMap(imageUrl: string): Promise<string | null> {
  try {
    // Initialize pipeline (lazy load)
    const pipe = await initPipeline();

    // Load and resize image
    const image = await RawImage.fromURL(imageUrl);

    // Resize to model's expected size while maintaining aspect ratio
    const aspectRatio = image.width / image.height;
    let targetWidth: number;
    let targetHeight: number;

    if (aspectRatio > 1) {
      targetWidth = MAX_DIMENSION;
      targetHeight = Math.round(MAX_DIMENSION / aspectRatio);
    } else {
      targetHeight = MAX_DIMENSION;
      targetWidth = Math.round(MAX_DIMENSION * aspectRatio);
    }

    const resizedImage = await image.resize(targetWidth, targetHeight);

    // Run depth estimation
    console.debug('[DepthService] Generating depth map...');
    const result = await pipe(resizedImage);

    // Convert depth tensor to canvas
    const depthCanvas = result.predicted_depth.toCanvas();

    // Convert canvas to base64
    const depthDataUrl = depthCanvas.toDataURL('image/png');
    console.debug('[DepthService] Depth map generated successfully');

    return depthDataUrl;
  } catch (error) {
    console.error('[DepthService] Depth map generation failed:', error);
    return null;
  }
}

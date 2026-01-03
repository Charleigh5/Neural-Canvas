/**
 * imageCompressionService.ts
 *
 * Provides client-side image compression for API optimization.
 * IMPORTANT: This compresses a COPY for API analysis only.
 * The original image is preserved for display/storage.
 */

export interface CompressionOptions {
  /** Max dimension (width or height). Default: 1568 (Gemini's optimal) */
  maxDimension?: number;
  /** Quality 0.0-1.0. Default: 0.92 (high quality) */
  quality?: number;
  /** Output format. Default: 'image/jpeg' (best compression) */
  outputFormat?: 'image/jpeg' | 'image/webp' | 'image/png';
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxDimension: 1568, // Gemini's optimal resolution
  quality: 0.92, // 92% quality - minimal loss, good compression
  outputFormat: 'image/jpeg',
};

/**
 * Compresses an image for API analysis while preserving quality.
 * Uses HTML5 Canvas API for browser-native processing.
 *
 * @param dataUrl - The original image as a data URL
 * @param options - Compression options
 * @returns Compressed image as a data URL (or original if already small)
 */
export const compressForAnalysis = (
  dataUrl: string,
  options: CompressionOptions = {}
): Promise<string> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;

      // Skip compression if image is already smaller than target
      if (width <= opts.maxDimension && height <= opts.maxDimension) {
        resolve(dataUrl);
        return;
      }

      // Calculate new dimensions (preserve aspect ratio)
      let newWidth = width;
      let newHeight = height;

      if (width > height) {
        if (width > opts.maxDimension) {
          newHeight = Math.round((height / width) * opts.maxDimension);
          newWidth = opts.maxDimension;
        }
      } else {
        if (height > opts.maxDimension) {
          newWidth = Math.round((width / height) * opts.maxDimension);
          newHeight = opts.maxDimension;
        }
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Use high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Export as compressed data URL
      const compressedUrl = canvas.toDataURL(opts.outputFormat, opts.quality);

      // Log compression stats for debugging
      const originalSize = Math.round((dataUrl.length * 0.75) / 1024); // Approx KB
      const compressedSize = Math.round((compressedUrl.length * 0.75) / 1024);
      console.debug(
        `[COMPRESS] ${width}x${height} → ${newWidth}x${newHeight} | ` +
          `${originalSize}KB → ${compressedSize}KB (${Math.round((1 - compressedSize / originalSize) * 100)}% reduction)`
      );

      resolve(compressedUrl);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    img.src = dataUrl;
  });
};

/**
 * Batch compress multiple images for analysis.
 * Processes in parallel for speed.
 */
export const compressBatch = async (
  dataUrls: string[],
  options?: CompressionOptions
): Promise<string[]> => {
  return Promise.all(dataUrls.map(url => compressForAnalysis(url, options)));
};

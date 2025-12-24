
/**
 * ANALYSIS.WORKER.TS
 * Offloads heavy image processing from the main thread.
 * Handles resizing via OffscreenCanvas and Base64 preparation.
 */

self.onerror = (e) => {
    console.error("Analysis Worker Internal Global Error:", e);
};

self.onmessage = async (e: MessageEvent) => {
  const { id, data, type } = e.data;

  if (type === 'PROCESS_IMAGE') {
    try {
      // Data is expected to be a Blob or DataURL from IndexedDB
      let blob: Blob;
      if (typeof data === 'string' && data.startsWith('data:')) {
        const response = await fetch(data);
        blob = await response.blob();
      } else if (data instanceof Blob) {
        blob = data;
      } else {
        throw new Error('Invalid data format received by worker');
      }

      const bitmap = await createImageBitmap(blob);
      
      // Target size for Gemini Analysis (to reduce bandwidth and latency)
      const MAX_DIM = 1024;
      let width = bitmap.width;
      let height = bitmap.height;

      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = (MAX_DIM / width) * height;
          width = MAX_DIM;
        } else {
          width = (MAX_DIM / height) * width;
          height = MAX_DIM;
        }
      }

      // Use OffscreenCanvas for background rendering
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get OffscreenCanvas context');
      
      ctx.drawImage(bitmap, 0, 0, width, height);
      
      // Convert to a compressed JPEG for Gemini
      const processedBlob = await canvas.convertToBlob({
        type: 'image/jpeg',
        quality: 0.85
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        self.postMessage({
          id,
          success: true,
          base64,
          mimeType: 'image/jpeg',
          originalDimensions: { w: bitmap.width, h: bitmap.height }
        });
      };
      reader.readAsDataURL(processedBlob);

    } catch (error: any) {
      console.error("Analysis Worker Processing Error:", error);
      self.postMessage({
        id,
        success: false,
        error: error.message || "Unknown analysis error"
      });
    }
  }
};

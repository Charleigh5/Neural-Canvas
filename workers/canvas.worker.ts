/**
 * CANVAS.WORKER.TS
 * Handles heavy computational tasks for the Infinite Canvas:
 * 1. Decoding image blobs into ImageBitmaps off-main-thread.
 * 2. Calculating semantic synaptic connections (O(n^2)) between nodes.
 */

self.onerror = e => {
  console.error('Canvas Worker Internal Global Error:', e);
};

self.onmessage = async (e: MessageEvent) => {
  const { id, type, payload } = e.data;

  try {
    // --- IMAGE DECODING ---
    if (type === 'DECODE_BITMAP') {
      const { blob } = payload;
      if (!blob) throw new Error('No blob provided for decoding');

      // Decode the blob into a GPU-ready bitmap
      const bitmap = await createImageBitmap(blob);
      // Transfer the bitmap back to main thread (zero-copy)
      (self as unknown as { postMessage(msg: object, transfer: Transferable[]): void }).postMessage(
        { id, success: true, result: bitmap },
        [bitmap]
      );
    }

    // --- SYNAPTIC CALCULATIONS ---
    else if (type === 'CALCULATE_SYNAPSES') {
      const { nodes, hoveredId } = payload;
      interface SynapseLine {
        points: number[];
        stroke: string;
        strokeWidth: number;
        opacity: number;
        key: string;
      }
      const lines: SynapseLine[] = [];
      const maxDist = 800;
      const genericTags = ['image', 'photo', 'picture', 'upload', 'generated'];

      // Optimization: Use simple for-loops for performance in worker
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (a.isStackChild) continue;

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          if (b.isStackChild) continue;

          // 1. Spatial Filter
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          // Approximation optimization: bounding box check before sqrt
          if (Math.abs(dx) > maxDist || Math.abs(dy) > maxDist) continue;

          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > maxDist) continue;

          // 2. Semantic Filter
          let shared = false;

          if (a.tags && b.tags) {
            for (let t = 0; t < a.tags.length; t++) {
              const tag = a.tags[t];
              if (!genericTags.includes(tag) && b.tags.includes(tag)) {
                shared = true;
                break;
              }
            }
          }

          // 3. Lineage Filter (Parent/Child)
          if (!shared && (a.parentId === b.id || b.parentId === a.id)) {
            shared = true;
          }

          if (shared) {
            const isRelevant = hoveredId === a.id || hoveredId === b.id;

            const aCx = a.x + (a.width * a.scale) / 2;
            const aCy = a.y + (a.height * a.scale) / 2;
            const bCx = b.x + (b.width * b.scale) / 2;
            const bCy = b.y + (b.height * b.scale) / 2;

            lines.push({
              points: [aCx, aCy, bCx, bCy],
              stroke: isRelevant ? '#6366f1' : '#475569',
              strokeWidth: isRelevant ? 2 : Math.max(0.5, 1.5 - dist / 400),
              opacity: isRelevant ? 0.8 : Math.max(0.05, 0.4 - dist / maxDist),
              key: `${a.id}-${b.id}`,
            });
          }
        }
      }
      self.postMessage({ id, success: true, result: lines });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown Worker Error';
    console.error('Canvas Worker Internal Error:', err);
    self.postMessage({ id, success: false, error: message });
  }
};

export {};

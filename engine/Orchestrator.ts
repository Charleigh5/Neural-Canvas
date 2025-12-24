import { ImageAsset } from '../types';
import { suggestNextImage } from '../services/geminiService';

export class OrchestratorEngine {
  currentImageId: string | null = null;
  nextImageId: string | null = null; // Lookahead buffer
  history: string[] = [];
  queue: string[] = []; // Explicit queue

  constructor() {}

  /**
   * Adds an image to the priority queue.
   */
  addToQueue(id: string) {
    this.queue.push(id);
  }

  /**
   * Advances the slideshow by moving the buffered 'next' image to 'current'.
   * Returns true if successful, false if no image was ready (buffer empty).
   */
  advance(): boolean {
    if (this.nextImageId) {
      this.registerHistory(this.nextImageId);
      this.nextImageId = null; // Clear buffer
      return true;
    }
    return false;
  }

  /**
   * Asynchronously decides and prepares the next image.
   * Populates this.nextImageId.
   */
  async prepareNext(images: ImageAsset[], mode: 'sequential' | 'smart-shuffle'): Promise<void> {
    if (images.length === 0) return;

    // 1. Priority Queue First (Live Injection)
    if (this.queue.length > 0) {
      this.nextImageId = this.queue.shift() || null;
      return;
    }

    // 2. Sequential Logic
    if (mode === 'sequential') {
      const currentIndex = images.findIndex(
        img => img.id === (this.nextImageId || this.currentImageId)
      );
      const nextIndex = (currentIndex + 1) % images.length;
      this.nextImageId = images[nextIndex].id;
      return;
    }

    // 3. Smart Shuffle (AI + Synaptic Weighting)

    // A. Context Setup
    const contextId = this.nextImageId || this.currentImageId;
    const currentImg = images.find(img => img.id === contextId);
    const currentTags = currentImg ? currentImg.tags : [];

    // B. Basic Filtering (Remove recent history & self)
    // We look further back (15 items) to prevent repetitive loops in smart mode
    const candidates = images.filter(
      img => !this.history.slice(-15).includes(img.id) && img.id !== contextId
    );

    // Safety check: if candidates empty (small library), fall back to full list excluding self
    let pool = candidates.length > 0 ? candidates : images.filter(i => i.id !== contextId);
    if (pool.length === 0) pool = images; // Fallback to anything

    // C. Synaptic Weighting (The "Graph" Logic)
    // If we have a current image, we prioritize nodes that share tags (Synapses).
    if (currentTags.length > 0) {
      const connectedCandidates = pool.filter(cand => cand.tags.some(t => currentTags.includes(t)));

      if (connectedCandidates.length > 0) {
        // STRATEGY: "Threaded Narrative"
        // We construct a pool that is heavily biased towards connected nodes (80%),
        // but includes a few random unconnected nodes (20%) to allow the AI to "drift"
        // or "pivot" if the current thread is exhausted or boring.

        const unconnectedCandidates = pool.filter(c => !connectedCandidates.includes(c));

        // Take up to 10 connected nodes
        const primaryPool = connectedCandidates.slice(0, 10);

        // Take up to 3 unconnected nodes (for visual contrast options)
        const driftPool = unconnectedCandidates.slice(0, 3);

        pool = [...primaryPool, ...driftPool];
      }
    }

    // D. Consult The Oracle (Gemini)
    // We pass our curated "Synaptic Pool" to Gemini for the final aesthetic decision.
    const suggestedId = await suggestNextImage(currentTags, pool, this.history);

    this.nextImageId = suggestedId || pool[0].id;
  }

  /**
   * Fallback for immediate synchronous requirements
   */
  getNext(images: ImageAsset[], _mode: 'sequential' | 'smart-shuffle'): string | null {
    if (images.length === 0) return null;

    // Quick Random
    const candidates = images.filter(img => !this.history.slice(-5).includes(img.id));
    const pool = candidates.length > 0 ? candidates : images;
    const randomId = pool[Math.floor(Math.random() * pool.length)].id;
    this.registerHistory(randomId);
    return randomId;
  }

  private registerHistory(id: string) {
    this.history.push(id);
    if (this.history.length > 50) this.history.shift();
    this.currentImageId = id;
  }
}

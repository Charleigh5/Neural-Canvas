# Open Source Integration Report

**Target:** Enhance "Neural Canvas & Orchestrator" functionality and aesthetic using high-quality open-source libraries.

## 1. Local Semantic Search (High Value)

**Problem:** The current `VectorStore` is a mock implementation. Search relies on simple tag matching, limiting the ability to find images by concept (e.g., "dog playing in snow" might fail if tags are just "dog", "winter").
**Solution:** **Transformers.js** + **Voy** (WASM Vector DB).

### Libraries
*   `@xenova/transformers`: Runs state-of-the-art models (like CLIP) directly in the browser.
*   `voy-search`: A lightweight WASM vector database optimized for the web.

### Integration Strategy

1.  **Install:**
    ```bash
    npm install @xenova/transformers voy-search
    ```

2.  **Implementation (Service Layer):**
    Create `services/semanticService.ts`:
    ```typescript
    import { pipeline } from '@xenova/transformers';
    import { Voy } from 'voy-search';

    let embedder = null;
    let index = null;

    export const initSemanticEngine = async () => {
      // Load CLIP model (optimized for web)
      embedder = await pipeline('feature-extraction', 'Xenova/clip-vit-base-patch32', {
        quantized: true,
      });
      
      // Initialize Voy Index
      index = new Voy({
        embeddings: [] // Load from IndexedDB persistence if available
      });
    };

    export const generateEmbedding = async (imageUrl: string) => {
      if (!embedder) await initSemanticEngine();
      const output = await embedder(imageUrl);
      return Array.from(output.data);
    };

    export const searchByText = async (query: string) => {
      if (!embedder) await initSemanticEngine();
      
      // 1. Embed text query
      const textEmbedding = await embedder(query);
      
      // 2. Search index
      // Voy handles the cosine similarity search efficiently via WASM
      const results = index.search(textEmbedding.data, 10);
      return results; // [{ id: 'img-1', score: 0.85 }, ...]
    };
    ```

3.  **UI Impact:**
    *   Enable "Natural Language Search" in the Command Deck.
    *   Allow "Find Similar" context menu action on any image.

## 2. Sci-Fi UI Polish (Aesthetic)

**Problem:** The current UI relies on custom Tailwind CSS borders. While good, it lacks the interactive, "living" feel of high-end sci-fi interfaces.
**Solution:** **Arwes** (Cyberprep Framework).

### Library
*   `@arwes/react` (Alpha version recommended for React 18/19 support)

### Integration Strategy

1.  **Install:**
    ```bash
    npm install @arwes/react @arwes/animator
    ```

2.  **Implementation (Component Layer):**
    Wrap key panels (like `InspectorPanel` or `StudioSequencer`) in Arwes frames.

    ```tsx
    import { FrameHexagon } from '@arwes/react-frames';
    import { Animator } from '@arwes/react-animator';

    export const SciFiPanel = ({ children }) => (
      <Animator active={true}>
        <div style={{ position: 'relative', padding: '20px' }}>
          <FrameHexagon
            style={{
              // Use app's theme colors
              '--arwes-frames-bg-color': '#050505',
              '--arwes-frames-line-color': '#6366f1', // Indigo-500
            }}
          />
          {children}
        </div>
      </Animator>
    );
    ```

3.  **UI Impact:**
    *   Panels animate open/close with "holographic" scanning effects.
    *   Buttons gain "click" sounds and visual feedback automatically.

## 3. Professional Audio Visualization

**Problem:** Current audio visualization is minimal or non-existent for the procedural audio.
**Solution:** **audiomotion-analyzer**.

### Library
*   `audiomotion-analyzer`

### Integration Strategy

1.  **Install:**
    ```bash
    npm install audiomotion-analyzer
    ```

2.  **Implementation (Visualizer Component):**
    Update `components/AudioWaveform.tsx` or create `SpectralVisualizer.tsx`:

    ```tsx
    import AudioMotionAnalyzer from 'audiomotion-analyzer';
    
    // In useEffect:
    const audioMotion = new AudioMotionAnalyzer(containerRef.current, {
      source: audioService.getMasterBus(), // Connect to existing Web Audio bus
      mode: 2, // Octave bands
      barSpace: 0.6,
      gradient: 'prism', // or custom theme colors
      showScaleX: false,
    });
    ```

3.  **UI Impact:**
    *   Adds a high-fidelity, real-time frequency analyzer to the `QuadMonitorView`.
    *   Makes the "Holiday Audio" visually responsive, enhancing the "Orchestrator" feel.

---

**Recommendation:** Start with **Step 1 (Semantic Search)**. It adds significant functional value that "mock" data cannot replicate, transforming the app into a true "Neural" canvas.

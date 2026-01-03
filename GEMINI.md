# Neural Canvas & Orchestrator

**Description:**
A high-performance React application designed as an "AI Studio" for managing, analyzing, and orchestrating image assets. It leverages Google Gemini for advanced AI features like semantic analysis, smart cropping, inpainting, and content generation. The core feature is the "Orchestrator," which intelligently sequences images into highlight reels based on visual and semantic connections.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **State Management:** Zustand
- **Canvas/Graphics:** Konva, react-konva, Framer Motion
- **AI:** Google Gemini API (`@google/genai`)
- **Audio:** Wavesurfer.js
- **Testing:** Vitest, React Testing Library
- **Styling:** Tailwind CSS (inferred from usage patterns, though not explicitly in package.json devDependencies, class names suggest it or similar utility classes)

## Architecture Overview

The project uses a **flat directory structure** (no `src/` folder).

- **`engine/Orchestrator.ts`**: The brain of the application. Manages the logic for selecting the next image in a sequence ("smart shuffle" vs. sequential) using synaptic weighting and AI suggestions.
- **`store/useStore.ts`**: A centralized Zustand store that manages:
  - Image assets (`images` array)
  - Application mode (`AppMode`)
  - Playback state (Reel sequencing, audio)
  - AI Processing Queues (Analysis, edits)
  - UI State (Panels, modals)
- **`services/`**: Encapsulates external logic:
  - `geminiService.ts`: Interface with Google Gemini API.
  - `physicsEngine.ts`: Handles collision detection and layout on the infinite canvas.
  - `db.ts`: IndexedDB wrapper for local persistence of reels and themes.
  - `exportEngine.ts`: Handles recording and exporting reels to video.
- **`components/`**: React components. Key views include:
  - `InfiniteCanvas.tsx`: The main workspace.
  - `QuadMonitorView.tsx`: The playback/presentation view.
  - `StudioSequencer.tsx`: Timeline for manual reel editing.
  - `HomeScreen.tsx`: Landing page.

## Development

**Prerequisites:** Node.js

### Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Environment:**
   Create a `.env.local` file and add your Gemini API key:

   ```env
   GEMINI_API_KEY=your_key_here
   ```

### Commands

- **Start Dev Server:** `npm run dev`
- **Build:** `npm run build`
- **Test:** `npm run test`
- **Lint:** `npm run lint`
- **Format:** `npm run format`

## Key Workflows

1. **Ingestion:** Images are added via `addImage` (supports local files and Google Photos via `googlePhotosService`).
2. **Analysis:** The `governor` in `geminiService` manages API rate limits while `processAnalysisQueue` in the store enriches images with tags and captions.
3. **Orchestration:** `OrchestrateReel` (in store) uses the `OrchestratorEngine` to generate a narrative sequence.
4. **Playback:** The `QuadMonitorView` consumes the `reel` state to display the sequence with transitions.

## Known Issues / Focus Areas

- **Highlight Reel Initialization:** There is a reported issue where the highlight reel gets stuck on initialization. The critical path involves `orchestrateReel` in `store/useStore.ts` and its connection to the UI trigger (likely in `HomeScreen.tsx` or `StudioSequencer.tsx`). Ensure the flow from "Click" -> "Orchestrate" -> "Play" is robust.

## Roadmap Status

**Current Phase:** Phase 5: Production & Polish

- **Completed:** Google Photos Integration, Asset Genealogy, Nano-Forge (Inpainting), Smart Crop V2, Render Export.
- **In Progress:** E2E Tests, Final Polish.

## AI Agent Guidelines

- **File Paths:** Do NOT use `src/` prefixes. The root directory contains the source code.
- **Styling:** Prioritize "Look Amazing" aesthetic.
- **AI Usage:** Use `@google/genai` exclusively.
- **Safety:** Always explain filesystem modifications before executing.

# Test Log - Neural Canvas & Orchestrator

## Phase 1: Vision Intelligence
- [ ] **Data Model Verification**
  - Verify `ImageAsset` has `cropData` and `stackId`.
- [ ] **Gemini Integration**
  - Upload an image.
  - Verify `gemini-2.5-flash` is called.
  - Verify result includes `tags` AND `rawBox`.
  - Verify `cropData` is calculated and saved to store.

## Phase 2: Stacks & Layouts
- [ ] **Stack Creation**
  - Select multiple images using Shift+Click.
  - Click "Stack" icon in context toolbar.
  - Verify images move to a central pile.
  - Verify "Stack (N)" badge appears.
- [ ] **Stack Expansion**
  - Click "Stack" badge.
  - Verify images animate to "Red Grid" layout.
  - Verify images are non-draggable in expanded state (managed layout).
- [ ] **Stack Collapse**
  - Click "Collapse" badge.
  - Verify images animate back to pile.
- [ ] **Unstack**
  - Select a stack (or image in stack).
  - Click "Unstack" icon.
  - Verify images return to loose state.

## Phase 3: Search & Isolation
- [ ] **Text Search**
  - Type a tag name (e.g., "dog") in the search bar.
  - Verify images WITHOUT that tag become dimmed (opacity 0.1).
  - Verify images WITH that tag remain bright.
- [ ] **Voice Search**
  - Click Microphone button.
  - Allow microphone permissions.
  - Speak a word.
  - Verify transcript appears in search bar.
  - Verify search executes.
- [ ] **Semantic Match**
  - Type a concept not explicitly tagged (e.g., "puppy" when tag is "dog").
  - Wait for AI search to resolve.
  - Verify relevant images are highlighted.

## Phase 4: Intelligent Orchestrator
- [ ] **Smart Shuffle Mode**
  - Ensure mode is set to 'Player' and Playback to 'smart-shuffle'.
  - Upload 10 images with distinct tags (e.g., 5 nature, 5 urban).
  - Start Playback.
  - Verify transitions are smooth (no loading delay) due to `nextImageId` lookahead.
  - Verify sequences generally follow a theme (Gemini logic) rather than pure random.
- [ ] **Queue Injection**
  - While playing, upload a new image.
  - Verify the NEW image is shown *immediately* as the next slide (Priority Queue test).
- [ ] **Loop Stability**
  - Let it run for >50 slides.
  - Verify history buffer doesn't overflow and slides eventually repeat.
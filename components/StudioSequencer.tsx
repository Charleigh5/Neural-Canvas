import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { Film, UploadCloud, Plus } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { GooglePhotosBrowser } from './GooglePhotosBrowser';
import { ThemePreviewModal } from './ThemePreviewModal';
import { ExportModal } from './ExportModal';
import { SequencerItem } from './sequencer/SequencerItem';
import { useSequencerDrag } from '../hooks/useSequencerDrag';
import { SaveReelModal } from './sequencer/SaveReelModal';
import { ReelLibrary } from './sequencer/ReelLibrary';
import { SequencerHeader } from './sequencer/SequencerHeader';

// Constants for Virtualization
const ITEM_WIDTH = 192; // w-48
const ITEM_GAP = 16; // gap-4
const ITEM_STRIDE = ITEM_WIDTH + ITEM_GAP;
const OVERSCAN = 5; // Number of items to render outside viewport

export const StudioSequencer = () => {
  const {
    images,
    reel,
    playback,
    togglePlayback,
    orchestrator,
    removeFromReel,
    reorderReel,
    performUpscale,
    duplicateImage,
    performImageEdit,
    updateImage,
    applySmartCrop,
    reanalyzeImage,
    playReel,
    toggleUiPanel,
    orchestrateReel,
    neuralTemperature,
  } = useStore();

  const [localReel, setLocalReel] = useState(reel);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const { isDraggingFile, handleDragOver, handleDragLeave, handleDrop } = useSequencerDrag();

  // Save State
  const [isSaving, setIsSaving] = useState(false);
  // removed legacy save state

  const [showGooglePhotos, setShowGooglePhotos] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Virtualization State
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 15 });

  useEffect(() => {
    setLocalReel(reel);
  }, [reel]);

  const handleReorder = (newOrder: string[]) => {
    setLocalReel(newOrder);
    reorderReel(newOrder);
  };

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;

    const start = Math.floor(scrollLeft / ITEM_STRIDE);
    const visibleCount = Math.ceil(clientWidth / ITEM_STRIDE);
    const end = start + visibleCount;

    setVisibleRange({
      start: Math.max(0, start - OVERSCAN),
      end: end + OVERSCAN,
    });
  }, []);

  // Initial calculation on mount/resize
  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [handleScroll]);

  const handleDurationChange = useCallback(
    (id: string, duration: number) => {
      updateImage(id, { duration: Math.max(1, duration) });
    },
    [updateImage]
  );

  const handleMenuAction = useCallback(
    async (id: string, action: string) => {
      const img = useStore.getState().images.find(i => i.id === id);
      if (!img) return;
      switch (action) {
        case 'analyze':
          await reanalyzeImage(id);
          break;
        case 'upscale':
          await performUpscale(id);
          break;
        case 'crop':
          applySmartCrop(id);
          break;
        case 'copy':
          await duplicateImage(id);
          break;
        case 'rotate':
          updateImage(id, { rotation: (img.rotation || 0) + 90 });
          break;
        case 'remove_bg':
          await performImageEdit(id, 'Remove background.', 'edit');
          break;
        case 'flip':
          updateImage(id, { flipX: !img.flipX });
          break;
      }
    },
    [reanalyzeImage, performUpscale, applySmartCrop, duplicateImage, updateImage, performImageEdit]
  );

  // Drag handlers replaced by hook
  // Save handlers moved to SaveReelModal

  const isReelEmpty = localReel.length === 0;

  return (
    <div
      className="w-full h-full flex flex-col text-slate-300 select-none bg-[#050508] relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {showGooglePhotos && <GooglePhotosBrowser onClose={() => setShowGooglePhotos(false)} />}
        {showPreview && <ThemePreviewModal onClose={() => setShowPreview(false)} />}
        {showExportModal && <ExportModal onClose={() => setShowExportModal(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {isDraggingFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-indigo-500/20 backdrop-blur-sm border-2 border-dashed border-indigo-400 flex flex-col items-center justify-center pointer-events-none"
          >
            <UploadCloud size={48} className="text-indigo-300 animate-bounce mb-2" />
            <span className="text-sm font-black text-white uppercase tracking-[0.2em]">
              Drop to Append to Reel
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <SequencerHeader
        reelLength={localReel.length}
        isPlaying={playback.isPlaying}
        neuralTemperature={neuralTemperature}
        audioSrc={playback.audioSrc}
        isAudioPlaying={playback.isAudioPlaying}
        beatSyncMode={playback.beatSyncMode}
        isLibraryOpen={isLibraryOpen}
        onTogglePlayback={togglePlayback}
        onToggleLibrary={() => setIsLibraryOpen(!isLibraryOpen)}
        onOpenGooglePhotos={() => setShowGooglePhotos(true)}
        onSave={() => setIsSaving(true)}
        onExport={() => setShowExportModal(true)}
        onOrchestrate={orchestrateReel}
        onOpenThemeStudio={() => toggleUiPanel('isThemeStudioOpen')}
        onPreview={() => setShowPreview(true)}
        onPlayReel={playReel}
      />

      {/* SAVE DIALOG */}
      <SaveReelModal isOpen={isSaving} onClose={() => setIsSaving(false)} />

      {/* LIBRARY DRAWER */}
      <ReelLibrary isOpen={isLibraryOpen} />

      {/* TIMELINE */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-x-auto custom-scrollbar flex items-center px-12 py-4 relative z-10 bg-[#08080a]"
        data-testid="sequencer-timeline"
      >
        <Reorder.Group
          axis="x"
          values={localReel}
          onReorder={handleReorder}
          className="flex items-center gap-4 h-full min-w-full"
        >
          {localReel.map((id, idx) => {
            const img = images.find(i => i.id === id);
            if (!img) return null;

            const isVisible = idx >= visibleRange.start && idx <= visibleRange.end;

            return (
              <SequencerItem
                key={id}
                id={id}
                idx={idx}
                img={img}
                isCurrent={orchestrator.currentImageId === id}
                isVisible={isVisible}
                onRemove={removeFromReel}
                onMenuAction={handleMenuAction}
                onDurationChange={handleDurationChange}
              />
            );
          })}
          {isReelEmpty ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 min-w-[300px] border-2 border-dashed border-white/5 rounded-3xl mx-12 z-20 mb-20 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-center max-w-md"
              >
                <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
                  <Film size={40} className="text-indigo-400/60" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">
                  Timeline Empty
                </h3>
                <p className="text-xs text-slate-500 font-mono mb-8 leading-relaxed uppercase tracking-tight">
                  Your narrative sequence is currently unmapped. <br />
                  Drag assets here or use the tools below to initialize.
                </p>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      const allIds = images.map(img => img.id);
                      if (allIds.length > 0) {
                        useStore.getState().addToReel(allIds);
                      } else {
                        useStore
                          .getState()
                          .addCouncilLog('No assets found on canvas to add.', 'warn');
                      }
                    }}
                    className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-300 transition-all"
                    data-testid="btn-add-all-from-canvas"
                  >
                    Add All From Canvas
                  </button>
                  <button
                    onClick={async () => {
                      const allIds = images.map(img => img.id);
                      if (allIds.length > 0) {
                        useStore.getState().addToReel(allIds);
                        // Slight delay to ensure state update before orchestration
                        setTimeout(() => orchestrateReel(), 100);
                      } else {
                        useStore
                          .getState()
                          .addCouncilLog('Add some images to the canvas first!', 'info');
                      }
                    }}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                    data-testid="btn-auto-orchestrate"
                  >
                    Auto-Orchestrate
                  </button>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="h-32 w-16 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-slate-600 hover:text-white hover:border-white/30 transition-colors shrink-0 cursor-pointer">
              <Plus size={24} />
            </div>
          )}
        </Reorder.Group>
      </div>
    </div>
  );
};

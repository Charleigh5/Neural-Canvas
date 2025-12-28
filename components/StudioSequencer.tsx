import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import {
  Play,
  Pause,
  Film,
  Sparkles,
  UploadCloud,
  Download,
  Plus,
  Save,
  FolderOpen,
  Cloud,
  Eye,
  Palette,
  Wand2,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { GooglePhotosBrowser } from './GooglePhotosBrowser';
import { ThemePreviewModal } from './ThemePreviewModal';
import { ExportModal } from './ExportModal';
import { SequencerItem } from './sequencer/SequencerItem';
import { useSequencerDrag } from '../hooks/useSequencerDrag';
import { SaveReelModal } from './sequencer/SaveReelModal';
import { ReelLibrary } from './sequencer/ReelLibrary';

// Constants for Virtualization
const ITEM_WIDTH = 192; // w-48
const ITEM_GAP = 16; // gap-4
const ITEM_STRIDE = ITEM_WIDTH + ITEM_GAP;
const OVERSCAN = 5; // Number of items to render outside viewport

import { Music } from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';
import { analyzeAudio } from '../services/audioService';

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
      <div className="h-14 border-b border-indigo-500/10 flex items-center justify-between px-8 bg-black/40 backdrop-blur-3xl shrink-0 z-20 relative">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-400 animate-pulse" />
            <span className="text-[11px] font-black text-white tracking-[0.4em] uppercase">
              Aurora_Sequencer
            </span>
          </div>

          <div className="flex items-center bg-white/5 rounded-full p-1 px-3 gap-3 border border-white/5">
            <button
              onClick={togglePlayback}
              className="text-indigo-400 hover:text-white transition-colors"
            >
              {playback.isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <span className="text-[10px] font-mono text-slate-500 tracking-widest">
              {localReel.length} PACKETS
            </span>
          </div>

          <div className="h-6 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLibraryOpen(!isLibraryOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                isLibraryOpen ? 'bg-indigo-600 text-white' : 'hover:bg-white/5 text-slate-400'
              }`}
            >
              <FolderOpen size={14} />{' '}
              <span className="text-[9px] font-black uppercase tracking-wider">Library</span>
            </button>
            <button
              onClick={() => setShowGooglePhotos(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-slate-400 transition-all"
            >
              <Cloud size={14} />{' '}
              <span className="text-[9px] font-black uppercase tracking-wider">Cloud</span>
            </button>
            <button
              onClick={() => setIsSaving(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-slate-400 transition-all"
              disabled={localReel.length === 0}
            >
              <Save size={14} />{' '}
              <span className="text-[9px] font-black uppercase tracking-wider">Save</span>
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-slate-400 transition-all"
              disabled={localReel.length === 0}
            >
              <Download size={14} />{' '}
              <span className="text-[9px] font-black uppercase tracking-wider">Export</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* AUDIO CONTROLS */}
          <div className="flex items-center gap-2 bg-white/5 rounded-full p-1 border border-white/5 pr-4">
            <label
              className="cursor-pointer hover:text-indigo-400 text-slate-500 transition-colors p-1.5"
              title="Upload Audio Track"
            >
              <Music size={14} />
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                aria-label="Upload Audio Track"
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    useStore.getState().setAudioSrc(url);
                    // Analyze
                    const analysis = await analyzeAudio(url);
                    useStore.getState().setBeatMarkers(analysis.peaks);
                    useStore
                      .getState()
                      .addCouncilLog(`Audio Loaded: ${Math.round(analysis.bpm)} BPM`, 'success');
                  }
                }}
              />
            </label>
            {playback.audioSrc && (
              <>
                <button
                  onClick={() => useStore.getState().setIsAudioPlaying(!playback.isAudioPlaying)}
                  className={playback.isAudioPlaying ? 'text-indigo-400' : 'text-slate-500'}
                  aria-label={playback.isAudioPlaying ? 'Pause Audio' : 'Play Audio'}
                  title={playback.isAudioPlaying ? 'Pause Audio' : 'Play Audio'}
                >
                  {playback.isAudioPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <div className="h-4 w-px bg-white/10 mx-1" />
                <button
                  onClick={() => useStore.getState().setBeatSyncMode(!playback.beatSyncMode)}
                  className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    playback.beatSyncMode
                      ? 'bg-indigo-500 text-white'
                      : 'text-slate-500 hover:text-indigo-400'
                  }`}
                >
                  Beat_Sync
                </button>
                {/* Mini Waveform */}
                <div className="w-24 h-6 opacity-50">
                  <AudioWaveform
                    audioSrc={playback.audioSrc}
                    height={24}
                    waveColor="#818cf8"
                    progressColor="#c7d2fe"
                  />
                </div>
              </>
            )}
          </div>

          {/* NEW: AI DIRECTOR BUTTON */}
          <button
            onClick={() => orchestrateReel()}
            disabled={localReel.length < 2 || neuralTemperature > 0}
            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/20 border border-indigo-500/30 rounded-full text-indigo-300 hover:text-white transition-all disabled:opacity-50"
          >
            {neuralTemperature > 0 ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Wand2 size={14} />
            )}
            <span className="text-[9px] font-black tracking-wider uppercase">AI Director</span>
          </button>

          <button
            onClick={() => toggleUiPanel('isThemeStudioOpen')}
            className="flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 text-indigo-300 rounded-full border border-indigo-500/20 transition-all"
          >
            <Palette size={14} />
            <span className="text-[9px] font-black tracking-wider uppercase">Themes</span>
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-full border border-cyan-500/30 transition-all"
            disabled={localReel.length === 0}
          >
            <Eye size={14} />
            <span className="text-[9px] font-black tracking-wider uppercase">Preview_Opener</span>
          </button>
          <button
            onClick={playReel}
            disabled={isReelEmpty}
            className={`
                            text-[10px] font-black tracking-[0.2em] px-8 py-2 rounded-full transition-all uppercase shadow-[0_0_30px_rgba(79,70,229,0.3)]
                            ${
                              isReelEmpty
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5 opacity-50'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                            }
                        `}
          >
            Initiate_Theater
          </button>
        </div>
      </div>

      {/* SAVE DIALOG */}
      <SaveReelModal isOpen={isSaving} onClose={() => setIsSaving(false)} />

      {/* LIBRARY DRAWER */}
      <ReelLibrary isOpen={isLibraryOpen} />

      {/* TIMELINE */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-x-auto custom-scrollbar flex items-center px-12 py-4 relative z-10 bg-[#08080a]"
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
            <div className="flex-1 flex flex-col items-center justify-center opacity-20 py-20 min-w-[300px]">
              <Film size={48} className="mb-4" />
              <span className="text-[10px] font-mono uppercase tracking-[0.4em]">
                Sequencer_Empty // Drag_Assets_Here
              </span>
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

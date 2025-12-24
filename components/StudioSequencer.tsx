import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import {
  Play,
  Pause,
  X,
  Film,
  Sparkles,
  UploadCloud,
  Download,
  Plus,
  Save,
  FolderOpen,
  Trash2,
  Cloud,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Palette,
  Wand2,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { GooglePhotosBrowser } from './GooglePhotosBrowser';
import { ThemePreviewModal } from './ThemePreviewModal';
import { ExportModal } from './ExportModal';
import { SequencerItem } from './sequencer/SequencerItem';

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
    savedReels,
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
    addImage,
    addToReel,
    saveReel,
    loadReel,
    deleteReel,
    playReel,
    toggleUiPanel,
    orchestrateReel,
    neuralTemperature,
  } = useStore();

  const [localReel, setLocalReel] = useState(reel);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Save State
  const [isSaving, setIsSaving] = useState(false);
  const [newReelName, setNewReelName] = useState('');
  const [overwriteTargetId, setOverwriteTargetId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

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

  // --- DRAG HANDLERS ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDraggingFile(false);
  };

  // FIX: Added explicit File casting to handle drop correctly in TypeScript
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const files = Array.from(e.dataTransfer.files as FileList).filter((f: File) =>
      f.type.startsWith('image/')
    );
    if (files.length > 0) {
      const newIds: string[] = [];
      for (const file of files as File[]) {
        const id = Math.random().toString(36).substring(2, 11);
        newIds.push(id);
        const reader = new FileReader();
        reader.onload = async ev => {
          const src = ev.target?.result as string;
          const imgObj = new window.Image();
          imgObj.src = src;
          imgObj.onload = () => {
            addImage({
              id,
              url: src,
              file: file,
              width: 400,
              height: 400 * (imgObj.height / imgObj.width),
              x: 0,
              y: 0,
              rotation: 0,
              scale: 1,
              tags: ['sequencer_drop', 'analyzing...'],
              analyzed: false,
              timestamp: Date.now(),
              duration: 5,
            });
          };
        };
        reader.readAsDataURL(file);
      }
      addToReel(newIds);
    }
  };

  const handleSaveRequest = () => {
    const name = newReelName.trim();
    if (!name) return;

    const existing = savedReels.find(r => r.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      setOverwriteTargetId(existing.id);
    } else {
      performSave(name);
    }
  };

  const performSave = (name: string, id?: string) => {
    try {
      saveReel(name, id);
      setSaveStatus('success');
      setTimeout(() => {
        setIsSaving(false);
        setSaveStatus('idle');
        setNewReelName('');
        setOverwriteTargetId(null);
      }, 1500);
    } catch (e) {
      setSaveStatus('error');
    }
  };

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
      <AnimatePresence>
        {isSaving && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl w-96 flex flex-col gap-4 overflow-hidden"
          >
            {saveStatus === 'success' ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center py-6 text-emerald-500"
              >
                <CheckCircle2 size={48} className="mb-2" />
                <span className="text-xs font-black uppercase tracking-widest">Reel Secure</span>
              </motion.div>
            ) : overwriteTargetId ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-amber-500 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                  <AlertTriangle size={20} />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Conflict Detected
                    </span>
                    <span className="text-[9px] font-mono opacity-80">
                      A reel named '{newReelName}' already exists.
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOverwriteTargetId(null)}
                    className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => performSave(newReelName, overwriteTargetId)}
                    className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white transition-colors"
                  >
                    Overwrite
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  <span>Persist Sequence</span>
                  <button
                    onClick={() => setIsSaving(false)}
                    className="hover:text-white"
                    aria-label="Close save dialog"
                  >
                    <X size={14} />
                  </button>
                </div>
                <input
                  autoFocus
                  type="text"
                  placeholder="Enter unique designation..."
                  value={newReelName}
                  onChange={e => setNewReelName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveRequest()}
                  className="bg-black border border-white/10 rounded-xl p-3 text-xs font-mono text-white focus:border-indigo-500 outline-none shadow-inner"
                />
                <button
                  onClick={handleSaveRequest}
                  disabled={!newReelName.trim()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
                >
                  Confirm Save
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIBRARY DRAWER */}
      <AnimatePresence>
        {isLibraryOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 160, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#020202] border-b border-white/10 overflow-hidden relative z-40"
          >
            <div className="flex gap-4 p-6 overflow-x-auto custom-scrollbar h-full items-center">
              {savedReels.length === 0 ? (
                <div className="text-slate-600 text-xs font-mono uppercase tracking-widest w-full text-center">
                  No Saved Reels Found
                </div>
              ) : (
                savedReels.map(reel => (
                  <div
                    key={reel.id}
                    className="group relative shrink-0 w-40 cursor-pointer"
                    onClick={() => loadReel(reel.id)}
                  >
                    <div className="aspect-video bg-slate-900 rounded-lg border border-white/10 overflow-hidden group-hover:border-indigo-500/50 transition-colors">
                      {reel.thumbnailUrl ? (
                        <img
                          src={reel.thumbnailUrl}
                          alt={`Thumbnail for ${reel.name} reel`}
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                          <Film size={24} />
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex justify-between items-start">
                      <div>
                        <div className="text-[10px] font-bold text-slate-300 group-hover:text-white truncate max-w-[120px]">
                          {reel.name}
                        </div>
                        <div className="text-[8px] font-mono text-slate-600">
                          {reel.itemIds.length} Items
                        </div>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          deleteReel(reel.id);
                        }}
                        className="text-slate-600 hover:text-rose-500 transition-colors"
                        aria-label={`Delete ${reel.name} reel`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

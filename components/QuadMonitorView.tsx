import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { AppMode, ImageAsset, PresentationMode } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Play,
  Pause,
  Settings,
  Maximize2,
  AlertTriangle,
  CornerDownLeft,
  Monitor,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from 'lucide-react';
import './QuadMonitorView.css';
import { AdaptiveRenderer } from './quad-view/AdaptiveRenderer';

// Note: This file uses inline styles for dynamic CSS variables and runtime-calculated
// bezel textures that cannot be predetermined in external CSS files.

import { HolidayAudio } from './quad-view/HolidayAudio';
import { HighlightConfigPanel } from './HighlightConfigPanel';
import {
  AuroraBorealis,
  BlizzardProtocol,
  ChimneyVents,
  DigitalFrost,
  IcicleFormation,
  YuleFireplace,
} from './quad-view/Atmosphere';
import {
  BezelGarland,
  FestiveStringLights,
  SnowGlobe,
  TreeDecorations,
  BezelGlitter,
} from './quad-view/Decorations';
import {
  CaptionOverlay,
  GiftUnboxOverlay,
  NeuralSentimentScanner,
  PolarTelemetry,
} from './quad-view/HUD';
import { GiftBoxArray, SleighSquad, YetiObserver } from './quad-view/Entities';
import { preloadImage } from '../hooks/useImage';
import { SpectralVisualizer } from './SpectralVisualizer';

export const QuadMonitorView: React.FC = () => {
  const {
    images,
    reel,
    orchestrator,
    playback,
    togglePlayback,
    nextSlide,
    setMode,
    setPresentationMode,
    addCouncilLog,
  } = useStore();

  const [currentAsset, setCurrentAsset] = useState<ImageAsset | undefined>(undefined);
  const [prevAsset, setPrevAsset] = useState<ImageAsset | undefined>(undefined);
  const [progress, setProgress] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [initError, setInitError] = useState(false);

  // Config Extraction
  const {
    speed,
    bezelTheme,
    snowDensity,
    activeThemeConfig,
    isPlaying,
    aspectRatio,
    presentationMode,
  } = playback;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const bezelContainerRef = useRef<HTMLDivElement>(null);
  const textureOverlayRef = useRef<HTMLDivElement>(null);

  // Sync Asset State & Preload
  useEffect(() => {
    const currId = orchestrator.currentImageId;
    if (currId) {
      const found = images.find(i => i.id === currId);
      if (found && found.id !== currentAsset?.id) {
        setPrevAsset(currentAsset);
        setCurrentAsset(found);
        setProgress(0); // Reset transition
        setInitError(false);
      }
    }
  }, [orchestrator.currentImageId, images, currentAsset]);

  // INTELLIGENT PRELOADER (OPTIMIZED)
  useEffect(() => {
    if (!currentAsset || reel.length === 0) return;

    // Determine indices to preload
    const currentIndex = reel.indexOf(currentAsset.id);
    if (currentIndex === -1) return;

    // Preload next 3 items for smoothness using Worker Decoding
    for (let i = 1; i <= 3; i++) {
      const nextIndex = (currentIndex + i) % reel.length;
      const nextId = reel[nextIndex];
      const nextImg = images.find(img => img.id === nextId);
      if (nextImg && nextImg.mediaType !== 'video') {
        preloadImage(nextImg.url);
      }
    }
  }, [currentAsset, reel, images]);

  // Animation Loop
  useEffect(() => {
    let raf: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (isPlaying) {
        setProgress(p => {
          const duration = currentAsset?.duration || speed;
          const nextP = p + dt / duration;
          if (nextP >= 1) {
            nextSlide();
            return 0;
          }
          return nextP;
        });
      }
      raf = requestAnimationFrame(animate);
    };

    if (isPlaying) raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, speed, nextSlide, currentAsset]);

  // --- RECOVERY LOGIC: Prevent "Initial_Boot_Sequence" Hang ---
  useEffect(() => {
    let recoveryTimer: ReturnType<typeof setTimeout>;

    // Immediate recovery check on mount
    if (!currentAsset && reel.length > 0) {
      // Try getting from orchestrator first, then fallback to reel start
      const targetId = orchestrator.currentImageId || reel[0];
      const targetImg = images.find(i => i.id === targetId);

      if (targetImg) {
        setCurrentAsset(targetImg);
      } else {
        // If orchestrator ID is invalid, check if ANY valid ID exists in the reel immediately
        const validBackupId = reel.find(id => images.some(i => i.id === id));

        if (validBackupId) {
          const backupImg = images.find(i => i.id === validBackupId);
          if (backupImg) setCurrentAsset(backupImg);
        } else {
          // Fallback timer if immediate check fails (e.g. state updating late)
          recoveryTimer = setTimeout(() => {
            addCouncilLog('Orchestrator sync delayed. Attempting final recovery...', 'warn');
            const finalAttemptId = reel.find(id => images.some(i => i.id === id));
            if (finalAttemptId) {
              const fallbackImg = images.find(i => i.id === finalAttemptId);
              if (fallbackImg) setCurrentAsset(fallbackImg);
            } else {
              // Reel is totally broken or empty
              setInitError(true);
            }
          }, 2000); // 2s timeout
        }
      }
    } else if (reel.length === 0) {
      setInitError(true);
    }

    return () => clearTimeout(recoveryTimer);
  }, [reel, currentAsset, orchestrator.currentImageId, images, addCouncilLog]);

  // --- PERSPECTIVE CONTROL ---
  const cameraModes: { id: PresentationMode; label: string; icon: React.ElementType }[] = [
    { id: 'flat', label: 'FLAT', icon: Monitor },
    { id: 'dutch', label: 'DUTCH', icon: ArrowUpRight },
    { id: 'low-angle', label: 'LOW', icon: ArrowUp },
    { id: 'overhead', label: 'TOP', icon: ArrowDown },
    { id: 'immersive', label: 'WIDE', icon: Maximize2 },
  ];

  const currentModeInfo = cameraModes.find(m => m.id === presentationMode) || cameraModes[0];

  const cyclePerspective = () => {
    const idx = cameraModes.findIndex(m => m.id === presentationMode);
    const next = cameraModes[(idx + 1) % cameraModes.length];
    setPresentationMode(next.id);
  };

  // Apply custom bezel styles via ref (must be before early return for hook rules)
  useEffect(() => {
    if (bezelTheme === 'custom' && activeThemeConfig) {
      if (bezelContainerRef.current) {
        bezelContainerRef.current.style.setProperty('--bezel-color', activeThemeConfig.bezelColor);
        bezelContainerRef.current.style.setProperty(
          '--bezel-shadow-color',
          `${activeThemeConfig.accentColor}50`
        );
      }
      if (
        textureOverlayRef.current &&
        activeThemeConfig.bezelTexture &&
        activeThemeConfig.bezelTexture !== 'none'
      ) {
        const textureSource = activeThemeConfig.bezelTexture.startsWith('url')
          ? activeThemeConfig.bezelTexture
          : 'none';
        const textureBackground = activeThemeConfig.bezelTexture.includes('gradient')
          ? `border-box ${activeThemeConfig.bezelTexture}`
          : 'none';
        textureOverlayRef.current.style.setProperty('--texture-source', textureSource);
        textureOverlayRef.current.style.setProperty('--texture-background', textureBackground);
      }
    }
  }, [bezelTheme, activeThemeConfig]);

  if (!currentAsset)
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/95 text-slate-500 font-mono text-xs tracking-widest uppercase relative glass-panel">
        {initError ? (
          <div className="flex flex-col items-center gap-6 p-10 border border-rose-900/50 bg-rose-950/10 rounded-3xl animate-in fade-in slide-in-from-bottom-4 shadow-[0_0_50px_rgba(244,63,94,0.1)]">
            <AlertTriangle
              size={56}
              className="text-rose-500 mb-2 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]"
            />
            <div className="text-center space-y-2">
              <div className="text-rose-400 font-black text-base tracking-widest uppercase border-b border-rose-500/30 pb-2">
                Projection System Failure
              </div>
              <div className="text-rose-500/80 text-[10px] bg-rose-950/30 px-3 py-1 rounded-full border border-rose-500/20">
                Asset pipeline disconnected or reel is empty.
              </div>
            </div>
            <button
              onClick={() => setMode(AppMode.CANVAS)}
              className="px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-rose-900/40 hover:scale-105 active:scale-95 text-[10px] font-black uppercase tracking-widest"
            >
              <CornerDownLeft size={16} /> Return to Canvas
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
              <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full animate-pulse" />
            </div>

            <span className="text-indigo-400 font-bold animate-pulse">Initializing Theater...</span>

            <button
              onClick={() => setInitError(true)}
              className="absolute bottom-12 text-[9px] text-slate-700 hover:text-rose-500 flex items-center gap-2 transition-colors border border-transparent hover:border-rose-900/30 px-3 py-1 rounded-full"
            >
              <RefreshCw size={10} /> Force Timeout
            </button>
          </div>
        )}
      </div>
    );

  // Bezel Styles
  const getBezelClass = () => {
    if (bezelTheme === 'christmas') return 'bezel-christmas';
    if (bezelTheme === 'gold') return 'bezel-gold';
    if (bezelTheme === 'frost') return 'bezel-frost';
    if (bezelTheme === 'candy') return 'bezel-candy';
    if (bezelTheme === 'custom' && activeThemeConfig) return 'bezel-custom';
    return 'bezel-standard';
  };

  // Camera Transforms
  const getContainerClass = () => {
    switch (presentationMode) {
      case 'dutch':
        return 'perspective-dutch';
      case 'low-angle':
        return 'perspective-low-angle';
      case 'overhead':
        return 'perspective-overhead';
      case 'immersive':
        return 'perspective-immersive';
      default:
        return 'perspective-flat';
    }
  };

  return (
    <div className="w-full h-full bg-[#020205] relative overflow-hidden" ref={containerRef}>
      <AnimatePresence>
        {showConfig && <HighlightConfigPanel onClose={() => setShowConfig(false)} />}
      </AnimatePresence>

      {/* --- GLOBAL AUDIO --- */}
      <HolidayAudio theme={bezelTheme} config={activeThemeConfig} />

      {/* --- BACKGROUND ATMOSPHERE --- */}
      <AuroraBorealis theme={bezelTheme} />
      <YuleFireplace theme={bezelTheme} config={activeThemeConfig} />

      {/* --- ENTITIES (Foreground/Midground) --- */}
      <SleighSquad theme={bezelTheme} />
      <YetiObserver theme={bezelTheme} />
      <GiftBoxArray theme={bezelTheme} />

      {/* --- MAIN STAGE CONTAINER --- */}
      <motion.div
        className={`absolute inset-0 flex items-center justify-center p-8 perspective-container ${getContainerClass()}`}
      >
        <div
          ref={bezelContainerRef}
          className={`relative overflow-hidden bg-black shadow-2xl z-10 bezel-container ${getBezelClass()} ${aspectRatio === '9:16' ? 'aspect-[9/16] h-[90%]' : 'aspect-video w-[90%]'}`}
        >
          {/* CUSTOM BEZEL TEXTURE */}
          {bezelTheme === 'custom' &&
            activeThemeConfig?.bezelTexture &&
            activeThemeConfig.bezelTexture !== 'none' && (
              <div
                ref={textureOverlayRef}
                className="absolute inset-0 z-[60] pointer-events-none border-[20px] border-transparent bezel-texture-overlay"
              />
            )}

          {/* --- THE RENDER ENGINE --- */}
          <AdaptiveRenderer
            prevAsset={prevAsset}
            currAsset={currentAsset}
            progress={progress} // 0 to 1 loop
            type={currentAsset.transition || 'dissolve'}
            kenBurns={currentAsset.kenBurns}
            currFocalPoint={currentAsset.focalPoint}
            prevFocalPoint={prevAsset?.focalPoint}
            duration={currentAsset.duration || speed}
          />

          {/* --- SCREEN OVERLAYS (HUD & FX) --- */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            <NeuralSentimentScanner theme={bezelTheme} asset={currentAsset} />
            <PolarTelemetry theme={bezelTheme} />

            {/* Real-time Audio Spectrum HUD */}
            <div className="absolute bottom-10 left-10 w-32 opacity-40">
              <SpectralVisualizer height={40} mode={2} />
              <div className="text-[7px] font-mono text-indigo-400 mt-1 uppercase tracking-widest">
                Audio_Sync_Active
              </div>
            </div>

            <CaptionOverlay caption={currentAsset.caption} show={playback.showCaptions} />
            <DigitalFrost active={true} />
            <BlizzardProtocol theme={bezelTheme} density={snowDensity} config={activeThemeConfig} />
            <GiftUnboxOverlay theme={bezelTheme} assetId={currentAsset.id} />
            <ChimneyVents theme={bezelTheme} config={activeThemeConfig} />
          </div>

          {/* --- BEZEL DECORATIONS --- */}
          <div className="absolute inset-0 z-30 pointer-events-none overflow-visible">
            <FestiveStringLights theme={bezelTheme} />
            <IcicleFormation theme={bezelTheme} config={activeThemeConfig} />
            <TreeDecorations theme={bezelTheme} />
          </div>
        </div>
      </motion.div>

      {/* --- INTERACTIVE PROPS (Outside Screen) --- */}
      <SnowGlobe theme={bezelTheme} containerRef={containerRef} />
      <div className="absolute inset-0 pointer-events-none z-40">
        <BezelGarland theme={bezelTheme} orientation="horizontal" />
        <BezelGlitter theme={bezelTheme} />
      </div>

      {/* --- PLAYER CONTROLS --- */}
      <div className="absolute top-8 right-8 z-[100] flex flex-col gap-3 group/controls">
        <div className="glass-panel p-2 rounded-2xl flex flex-col gap-3 opacity-0 group-hover/controls:opacity-100 transition-all duration-500 translate-x-10 group-hover/controls:translate-x-0 shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-2xl">
          {/* Mode Cycler */}
          <div className="relative group/mode w-full flex justify-end">
            <button
              onClick={cyclePerspective}
              className="w-10 h-10 glass-button rounded-xl flex items-center justify-center text-slate-300 hover:text-white"
              aria-label="Cycle camera perspective"
              title="Cycle camera perspective"
            >
              <currentModeInfo.icon size={18} />
            </button>
            <div className="absolute top-1/2 right-12 -translate-y-1/2 bg-black/90 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-white/10 opacity-0 group-hover/mode:opacity-100 transition-opacity whitespace-nowrap shadow-xl transform scale-90 group-hover/mode:scale-100 pointer-events-none">
              CAM: {currentModeInfo.label}
            </div>
          </div>

          <button
            onClick={() => setShowConfig(true)}
            className="w-10 h-10 glass-button rounded-xl flex items-center justify-center text-slate-300 hover:text-white"
            aria-label="Open settings"
            title="Open settings"
          >
            <Settings size={18} />
          </button>

          <div className="h-px w-full bg-white/10" />

          <button
            onClick={togglePlayback}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-all ${isPlaying ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20' : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20'}`}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
          </button>
          <button
            onClick={() => setMode(AppMode.CANVAS)}
            className="w-10 h-10 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-600/30 rounded-xl flex items-center justify-center transition-all shadow-lg"
            aria-label="Exit theater mode"
            title="Exit theater mode"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

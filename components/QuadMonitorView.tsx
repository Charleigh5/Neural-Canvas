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
      <div className="w-full h-full flex items-center justify-center bg-black text-slate-500 font-mono text-xs tracking-widest uppercase relative">
        {initError ? (
          <div className="flex flex-col items-center gap-6 p-8 border border-rose-900/50 bg-rose-950/20 rounded-2xl animate-in fade-in slide-in-from-bottom-4">
            <AlertTriangle size={48} className="text-rose-500 mb-2" />
            <div className="text-center space-y-2">
              <div className="text-rose-400 font-bold text-sm">Projection System Failure</div>
              <div className="text-rose-500/60 text-[10px]">
                Asset pipeline disconnected or reel is empty.
              </div>
            </div>
            <button
              onClick={() => setMode(AppMode.CANVAS)}
              className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center gap-2 transition-all shadow-lg hover:shadow-rose-500/20"
            >
              <CornerDownLeft size={14} /> Return to Canvas
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
            Initializing Theater...
            <button
              onClick={() => setInitError(true)}
              className="absolute bottom-12 text-[9px] text-slate-700 hover:text-slate-500 flex items-center gap-1"
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
      <div className="absolute top-0 right-0 p-6 z-[100] flex gap-4 opacity-0 hover:opacity-100 transition-opacity">
        {/* Mode Cycler */}
        <div className="relative group">
          <button
            onClick={cyclePerspective}
            className="w-12 h-12 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-black/80 transition-all border border-white/10"
            aria-label="Cycle camera perspective"
            title="Cycle camera perspective"
          >
            <currentModeInfo.icon size={20} />
          </button>
          <div className="absolute top-1/2 right-14 -translate-y-1/2 bg-black/80 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            CAM: {currentModeInfo.label}
          </div>
        </div>

        <button
          onClick={() => setShowConfig(true)}
          className="w-12 h-12 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-black/80 transition-all border border-white/10"
          aria-label="Open settings"
          title="Open settings"
        >
          <Settings size={20} />
        </button>
        <button
          onClick={togglePlayback}
          className="w-12 h-12 bg-indigo-600/80 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-indigo-500 transition-all shadow-lg"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
        </button>
        <button
          onClick={() => setMode(AppMode.CANVAS)}
          className="w-12 h-12 bg-rose-600/80 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-rose-500 transition-all shadow-lg"
          aria-label="Exit theater mode"
          title="Exit theater mode"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

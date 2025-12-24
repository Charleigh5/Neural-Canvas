import React from 'react';
import { useStore } from '../store/useStore';
import { AppMode, BezelTheme, ThemeConfig, PresentationMode } from '../types';
import {
  X,
  Play,
  Zap,
  Snowflake,
  Gift,
  Monitor,
  Palette,
  Wind,
  Check,
  Library,
  Camera,
  ArrowUpRight,
  Maximize2,
  MoveVertical,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const HighlightConfigPanel = ({ onClose }: { onClose: () => void }) => {
  const {
    playback,
    setBezelTheme,
    setPlaybackSpeed,
    toggleQuadMode,
    setMode,
    togglePlayback,
    playReel,
    setSnowDensity,
    savedThemes,
    setCustomTheme,
    setPresentationMode,
  } = useStore();

  const themes: { id: BezelTheme; name: string; icon: any; color: string; desc: string }[] = [
    {
      id: 'standard',
      name: 'Standard',
      icon: Monitor,
      color: 'text-gray-400',
      desc: 'Clean, minimalist bezel.',
    },
    {
      id: 'christmas',
      name: 'Holiday',
      icon: Gift,
      color: 'text-red-400',
      desc: 'Decorations, snow, and warmth.',
    },
    {
      id: 'frost',
      name: 'Cryo',
      icon: Snowflake,
      color: 'text-cyan-300',
      desc: 'Frozen glass and ice particles.',
    },
    {
      id: 'gold',
      name: 'Midas',
      icon: Zap,
      color: 'text-yellow-400',
      desc: 'Luxurious gold leaf finish.',
    },
    {
      id: 'candy',
      name: 'Candy',
      icon: Palette,
      color: 'text-pink-400',
      desc: 'Vibrant pop-art aesthetic.',
    },
  ];

  const cameraModes: { id: PresentationMode; name: string; icon: any }[] = [
    { id: 'flat', name: 'Flat', icon: Monitor },
    { id: 'dutch', name: 'Dutch', icon: ArrowUpRight },
    { id: 'low-angle', name: 'Low', icon: MoveVertical },
    { id: 'overhead', name: 'Top', icon: MoveVertical }, // Reused icon but rotation handled in logic
    { id: 'immersive', name: 'Wide', icon: Maximize2 },
  ];

  const handleLaunch = () => {
    // Use playReel to ensure proper initialization of the orchestrator state
    playReel();
    onClose();
  };

  const handleCustomThemeSelect = (theme: ThemeConfig) => {
    setCustomTheme(theme);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
      <div className="w-full max-w-5xl h-[80vh] bg-[#050508] border border-white/10 rounded-3xl flex overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]">
        {/* --- LEFT: VISUAL PREVIEW (Mini Theater) --- */}
        <div className="w-[45%] bg-[#020202] relative border-r border-white/5 p-8 flex flex-col items-center justify-center gap-6">
          <div className="absolute top-6 left-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">
            Pre-Flight Visualizer
          </div>

          {/* The Screen Representation */}
          <div
            className={`
                    relative aspect-video w-full rounded-xl bg-black overflow-hidden shadow-2xl transition-all duration-500
                    ${
                      playback.bezelTheme === 'christmas'
                        ? 'border-[8px] border-[#3f0e0e] shadow-red-900/20'
                        : playback.bezelTheme === 'gold'
                          ? 'border-[4px] border-yellow-700 shadow-yellow-900/20'
                          : playback.bezelTheme === 'custom' && playback.activeThemeConfig
                            ? ''
                            : 'border-[4px] border-slate-800'
                    }
                `}
             
            style={{
              ...(playback.bezelTheme === 'custom' && playback.activeThemeConfig
                ? {
                    border: `8px solid ${playback.activeThemeConfig.bezelColor}`,
                    boxShadow: `0 0 40px ${playback.activeThemeConfig.accentColor}40`,
                  }
                : {}),
              // Simulate the camera angle in preview (scaled down effect)
              transform:
                playback.presentationMode === 'dutch'
                  ? 'rotateZ(-3deg) scale(0.95)'
                  : playback.presentationMode === 'low-angle'
                    ? 'perspective(800px) rotateX(10deg)'
                    : playback.presentationMode === 'overhead'
                      ? 'perspective(800px) rotateX(-10deg)'
                      : playback.presentationMode === 'immersive'
                        ? 'scale(1.05)'
                        : 'none',
            }}
          >
            {/* Simulated Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white/10 font-mono text-4xl font-black tracking-tighter">
                PREVIEW
              </div>
            </div>

            {/* Theme Overlays (Simplified for Preview) */}
            {playback.bezelTheme === 'christmas' && (
              <>
                <div className="absolute top-0 w-full h-8 bg-gradient-to-b from-red-500/10 to-transparent" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/snow.png')] opacity-20" />
              </>
            )}
            {playback.bezelTheme === 'frost' && (
              <div className="absolute inset-0 border-[20px] border-white/10 rounded-lg blur-md" />
            )}
            {playback.bezelTheme === 'custom' &&
              playback.activeThemeConfig?.bezelTexture !== 'none' && (
                <div
                  className="absolute inset-0 z-[50] pointer-events-none opacity-50 mix-blend-overlay"
                   
                  style={{ backgroundImage: playback.activeThemeConfig?.bezelTexture }}
                />
              )}
          </div>

          <div className="text-center space-y-2 max-w-xs">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
              {playback.bezelTheme === 'custom' && playback.activeThemeConfig
                ? playback.activeThemeConfig.name
                : themes.find(t => t.id === playback.bezelTheme)?.name}{' '}
              Mode
            </h2>
            <p className="text-xs font-mono text-slate-500 leading-relaxed">
              {playback.bezelTheme === 'custom' && playback.activeThemeConfig
                ? playback.activeThemeConfig.description
                : themes.find(t => t.id === playback.bezelTheme)?.desc}
            </p>
          </div>
        </div>

        {/* --- RIGHT: CONFIGURATION GRID --- */}
        <div className="flex-1 flex flex-col bg-[#0a0a0a]">
          {/* Header */}
          <div className="h-20 flex items-center justify-between px-8 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Monitor size={20} className="text-indigo-500" />
              <span className="text-sm font-black text-white uppercase tracking-[0.2em]">
                Theater_Config
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              aria-label="Close panel"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
            {/* 1. Theme Grid */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                System Presets
              </label>
              <div className="grid grid-cols-3 gap-3">
                {themes.map(t => {
                  const isActive = playback.bezelTheme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setBezelTheme(t.id)}
                      className={`
                                            relative h-28 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all group
                                            ${
                                              isActive
                                                ? 'bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/50'
                                                : 'bg-black border-white/10 hover:border-white/30 hover:bg-white/5'
                                            }
                                        `}
                    >
                      <div
                        className={`p-2 rounded-full ${isActive ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-500 group-hover:text-white'}`}
                      >
                        <t.icon size={20} />
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-slate-500'}`}
                      >
                        {t.name}
                      </span>
                      {isActive && (
                        <div className="absolute top-3 right-3 bg-indigo-500 text-white rounded-full p-0.5">
                          <Check size={10} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Custom Themes */}
            {savedThemes.length > 0 && (
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Library size={10} /> My Themes
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {savedThemes.map(t => {
                    const isActive =
                      playback.bezelTheme === 'custom' && playback.activeThemeConfig?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleCustomThemeSelect(t)}
                        className={`
                                                relative h-28 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all group
                                                ${
                                                  isActive
                                                    ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/50'
                                                    : 'bg-black border-white/10 hover:border-emerald-500/30 hover:bg-white/5'
                                                }
                                        `}
                      >
                        <div className="flex gap-1 absolute top-3 left-3">
                          <div
                            className="w-2 h-2 rounded-full"
                             
                            style={{ backgroundColor: t.bezelColor }}
                          />
                          <div
                            className="w-2 h-2 rounded-full"
                             
                            style={{ backgroundColor: t.accentColor }}
                          />
                        </div>
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest mt-4 ${isActive ? 'text-white' : 'text-slate-500'}`}
                        >
                          {t.name}
                        </span>
                        {isActive && (
                          <div className="absolute top-3 right-3 bg-emerald-500 text-white rounded-full p-0.5">
                            <Check size={10} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Camera & View */}
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Camera size={12} /> Camera Perspective
                </label>
                <div className="flex bg-black p-1 rounded-xl border border-white/10 overflow-x-auto">
                  {cameraModes.map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setPresentationMode(mode.id)}
                      className={`
                                            flex-1 py-3 px-2 rounded-lg flex flex-col items-center gap-2 transition-all min-w-[70px]
                                            ${
                                              playback.presentationMode === mode.id
                                                ? 'bg-white text-black shadow-lg'
                                                : 'text-slate-500 hover:text-white hover:bg-white/5'
                                            }
                                        `}
                    >
                      <mode.icon size={16} />
                      <span className="text-[9px] font-black uppercase tracking-wider">
                        {mode.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Parameters */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Slide Duration
                  </label>
                  <span className="text-[10px] font-mono text-indigo-400 font-bold">
                    {playback.speed}s
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="15"
                  value={playback.speed}
                  onChange={e => setPlaybackSpeed(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
                  aria-label="Slide Duration"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  View Mode
                </label>
                <div className="flex bg-black p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => {
                      if (playback.quadMode) toggleQuadMode();
                    }}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${!playback.quadMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Single
                  </button>
                  <button
                    onClick={() => {
                      if (!playback.quadMode) toggleQuadMode();
                    }}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${playback.quadMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Quad
                  </button>
                </div>
              </div>
            </div>

            {/* 5. Conditional: Snow Density */}
            {playback.bezelTheme === 'christmas' && (
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/30 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center text-red-300">
                  <div className="flex items-center gap-2">
                    <Wind size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Blizzard Intensity
                    </span>
                  </div>
                  <span className="text-[10px] font-mono">{playback.snowDensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={playback.snowDensity}
                  onChange={e => setSnowDensity(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-red-900/30 rounded-full appearance-none cursor-pointer accent-red-500"
                  aria-label="Blizzard Intensity"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-white/5 bg-white/[0.02]">
            <button
              onClick={handleLaunch}
              className="w-full py-4 bg-white text-black rounded-xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-50 hover:scale-[1.01] transition-all shadow-xl shadow-white/5"
            >
              <Play size={18} fill="black" /> Launch Experience
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

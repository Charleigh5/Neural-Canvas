import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
  X,
  Sparkles,
  Monitor,
  Gift,
  Snowflake,
  Zap,
  Palette,
  CloudRain,
  Wind,
  Music,
  Type,
  Check,
  Smartphone,
  Maximize,
  Captions,
  Loader2,
  Wand2,
  Sliders,
  Droplets,
  Flame,
  Speaker,
  Layout,
  BrainCircuit,
  Save,
  Trash2,
  Library,
  Disc,
  Layers,
  Plus,
  Dice5,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BezelTheme, ThemeConfig, ImageAsset } from '../types';

export const ThemeStudio: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    playback,
    setBezelTheme,
    setPlaybackSpeed,
    setAspectRatio,
    toggleCaptions,
    generateCustomTheme,
    setCustomTheme,
    generateCaptionsForReel,
    neuralTemperature,
    saveTheme,
    deleteTheme,
    savedThemes,
    images,
    reel,
  } = useStore();

  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Ensure active config is always available for editing
  const activeConfig: ThemeConfig =
    playback.bezelTheme === 'custom' && playback.activeThemeConfig
      ? playback.activeThemeConfig
      : {
          id: 'scratch',
          name: 'Scratchpad',
          description: 'Custom Theme',
          bezelColor: '#1a1a1a',
          bezelTexture: 'none',
          overlayType: 'none',
          particleDensity: 0,
          audioAmbience: 'none',
          fontFamily: 'Inter',
          accentColor: '#6366f1',
        };

  const ingredients = {
    Mood: ['Cyberpunk', 'Ethereal', 'Rustic', 'Noir', 'Sci-Fi', 'Minimalist'],
    Palette: ['Neon', 'Pastel', 'Gold/Black', 'Crimson', 'Ice', 'Obsidian'],
    FX: ['Blizzard', 'Rain', 'Embers', 'Glitter', 'Fog', 'Stardust'],
  };

  const oneClickHolidays = [
    {
      name: 'Cyberpunk Santa',
      prompt:
        'Cyberpunk Christmas: Neon red and green lights, holographic snowflakes, dark metallic bezel, synthwave holiday audio.',
    },
    {
      name: 'Cozy Cabin',
      prompt:
        'Rustic Cabin: Wood texture bezel, warm ember overlay, soft acoustic audio, cozy atmosphere.',
    },
    {
      name: 'Frozen Kingdom',
      prompt:
        'Ice Queen: Diamond texture bezel, intense blizzard overlay, magical chime audio, cool blue accents.',
    },
  ];

  const bezelTextures = [
    { id: 'none', name: 'Matte Finish' },
    {
      id: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")',
      name: 'Carbon Fiber',
    },
    {
      id: 'url("https://www.transparenttextures.com/patterns/wood-pattern.png")',
      name: 'Dark Wood',
    },
    {
      id: 'url("https://www.transparenttextures.com/patterns/brushed-alum.png")',
      name: 'Brushed Metal',
    },
    { id: 'url("https://www.transparenttextures.com/patterns/stardust.png")', name: 'Stardust' },
    { id: 'linear-gradient(45deg, #FFD700, #FDB931)', name: 'Gold Leaf' },
  ];

  const handleGenerate = async () => {
    if (!customPrompt.trim()) return;
    setIsGenerating(true);
    try {
      await generateCustomTheme(customPrompt);
    } catch (error) {
      console.error('Theme generation failed:', error);
      // Optionally add toast notification here in the future
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOneClick = async (prompt: string) => {
    setCustomPrompt(prompt);
    setIsGenerating(true);
    try {
      await generateCustomTheme(prompt);
    } catch (error) {
      console.error('Theme generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateConfig = (updates: Partial<ThemeConfig>) => {
    const base = playback.activeThemeConfig || activeConfig;
    const newConfig = { ...base, ...updates };
    setCustomTheme(newConfig);
  };

  const handleSaveTheme = () => {
    if (!saveName.trim()) return;
    const newTheme: ThemeConfig = {
      ...activeConfig,
      id: `user-${Date.now()}`,
      name: saveName,
    };
    saveTheme(newTheme);
    setSaveName('');
    setIsSaving(false);
  };

  const handleLoadTheme = (theme: ThemeConfig) => {
    setCustomTheme(theme);
  };

  const appendIngredient = (text: string) => {
    setCustomPrompt(prev => (prev.trim() ? `${prev.trim()}, ${text}` : text));
  };

  const handleRandomize = () => {
    const rMood = ingredients.Mood[Math.floor(Math.random() * ingredients.Mood.length)];
    const rPalette = ingredients.Palette[Math.floor(Math.random() * ingredients.Palette.length)];
    const rFX = ingredients.FX[Math.floor(Math.random() * ingredients.FX.length)];
    setCustomPrompt(`${rMood} mood with ${rPalette} colors and ${rFX} effects`);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-7xl h-[85vh] bg-[#08080a] border border-white/10 rounded-3xl flex overflow-hidden shadow-2xl relative">
        {/* Global AI Processing Overlay */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[400] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-30 animate-pulse" />
                <BrainCircuit size={64} className="text-indigo-400 relative z-10 animate-bounce" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-[14px] font-black text-white uppercase tracking-[0.4em] animate-pulse">
                  Neural_Synthesis_In_Progress
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  Applying theme configuration & remixing reel assets
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- LEFT: LIBRARY & SAVED THEMES --- */}
        <div className="w-72 border-r border-white/10 bg-[#050505] flex flex-col">
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Library className="text-emerald-500" size={18} />
              <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">
                Theme_Vault
              </h2>
            </div>
            <p className="text-[9px] text-slate-500 font-mono">Persisted Configurations</p>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {savedThemes.length === 0 ? (
              <div className="p-4 border border-dashed border-white/10 rounded-xl text-center">
                <span className="text-[9px] text-slate-600 font-mono uppercase">Vault Empty</span>
              </div>
            ) : (
              savedThemes.map(theme => (
                <div
                  key={theme.id}
                  className="group relative p-3 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer"
                  onClick={() => handleLoadTheme(theme)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">
                      {theme.name}
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        deleteTheme(theme.id);
                      }}
                      className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="mt-2 flex gap-1">
                    <div
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: theme.bezelColor }}
                    />
                    <div
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: theme.accentColor }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- CENTER: THE LAB (CONFIGURATION) --- */}
        <div className="flex-1 flex flex-col bg-[#0a0a0a]">
          <div className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-[#050505]">
            <div className="flex items-center gap-3">
              <Sliders size={18} className="text-fuchsia-400" />
              <span className="text-sm font-black text-white uppercase tracking-[0.2em]">
                Configuration_Lab
              </span>
            </div>

            <div className="flex items-center gap-4">
              {isSaving ? (
                <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1 animate-in slide-in-from-right-4">
                  <input
                    type="text"
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    placeholder="Theme Name..."
                    className="bg-transparent border-none text-[10px] text-white px-2 outline-none w-32"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTheme}
                    disabled={!saveName.trim()}
                    className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={() => setIsSaving(false)}
                    className="p-1.5 bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white rounded-md transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSaving(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:text-white hover:bg-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                >
                  <Save size={14} /> Save Current
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <div className="grid grid-cols-2 gap-8">
              {/* Visuals */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">
                  Visual Acoustics
                </h3>

                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Layout size={10} /> Bezel Material
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                      <input
                        type="color"
                        value={activeConfig.bezelColor || '#1a1a1a'}
                        onChange={e => updateConfig({ bezelColor: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                        title="Base Color"
                      />
                      <span className="text-[9px] font-mono text-slate-500">Base Tint</span>
                    </div>
                    <select
                      value={activeConfig.bezelTexture || 'none'}
                      onChange={e => updateConfig({ bezelTexture: e.target.value })}
                      className="bg-white/5 border border-white/5 rounded-xl p-2 text-[9px] text-white font-mono outline-none focus:border-indigo-500"
                    >
                      {bezelTextures.map(tex => (
                        <option key={tex.id} value={tex.id}>
                          {tex.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CloudRain size={10} /> Atmosphere
                  </label>
                  <select
                    value={activeConfig.overlayType || 'none'}
                    onChange={e => updateConfig({ overlayType: e.target.value as any })}
                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-[10px] text-white font-black uppercase outline-none focus:border-indigo-500 transition-all"
                  >
                    <option value="none">Clear</option>
                    <option value="snow">Blizzard</option>
                    <option value="rain">Rainfall</option>
                    <option value="dust">Floating Dust</option>
                    <option value="glitter">Glitter Shimmer</option>
                    <option value="embers">Fire Embers</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Wind size={10} /> Particle Density
                    </label>
                    <span className="text-[9px] font-mono text-indigo-400">
                      {activeConfig.particleDensity || 0}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={activeConfig.particleDensity || 0}
                    onChange={e => updateConfig({ particleDensity: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-fuchsia-500"
                  />
                </div>
              </div>

              {/* Audio & Brand */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">
                  Sensory & Brand
                </h3>

                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Speaker size={10} /> Audio Ambience
                  </label>
                  <select
                    value={activeConfig.audioAmbience || 'none'}
                    onChange={e => updateConfig({ audioAmbience: e.target.value as any })}
                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-[10px] text-white font-black uppercase outline-none focus:border-indigo-500 transition-all"
                  >
                    <option value="none">Muted</option>
                    <option value="holiday">Holiday Cheer</option>
                    <option value="lofi">Lofi Chill</option>
                    <option value="storm">Thunderstorm</option>
                    <option value="cinematic">Deep Drone</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Type size={10} /> Typography
                  </label>
                  <select
                    value={activeConfig.fontFamily || 'Inter'}
                    onChange={e => updateConfig({ fontFamily: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-[10px] text-white font-black uppercase outline-none focus:border-indigo-500 transition-all"
                  >
                    <option value="Inter">Modern Sans</option>
                    <option value="serif">Editorial Serif</option>
                    <option value="monospace">Tech Mono</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Palette size={10} /> Accent Glow
                  </label>
                  <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/5">
                    <input
                      type="color"
                      value={activeConfig.accentColor || '#6366f1'}
                      onChange={e => updateConfig({ accentColor: e.target.value })}
                      className="w-full h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                  </div>
                </div>

                {/* New Narrative Section */}
                <div className="space-y-3 border-t border-white/5 pt-4">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Captions size={10} /> Narrative Layer
                  </label>

                  <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/5">
                    <span className="text-[9px] font-mono text-slate-500 pl-2">Show Captions</span>
                    <div
                      onClick={toggleCaptions}
                      className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${playback.showCaptions ? 'bg-indigo-500' : 'bg-slate-700'}`}
                    >
                      <motion.div
                        className="w-3 h-3 bg-white rounded-full shadow-sm"
                        animate={{ x: playback.showCaptions ? 16 : 0 }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={generateCaptionsForReel}
                    disabled={neuralTemperature > 0 || reel.length === 0}
                    className="w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {neuralTemperature > 0 ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Wand2 size={12} />
                    )}
                    Generate AI Captions
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT: GENERATOR & CLOSE --- */}
        <div className="w-[340px] bg-[#050505] border-l border-white/10 flex flex-col">
          <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Sparkles className="text-indigo-500" size={18} />
              <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">
                Neural_Gen
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            <div className="space-y-3">
              <div className="relative">
                <textarea
                  value={customPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  placeholder="Describe mood, colors, atmosphere (e.g. 'Cyberpunk neon rain with metallic bezels')..."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-[11px] text-white font-mono outline-none focus:border-indigo-500/50 resize-none transition-all shadow-inner"
                />
                {customPrompt && (
                  <button
                    onClick={() => setCustomPrompt('')}
                    className="absolute top-3 right-3 text-slate-600 hover:text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* NEURAL INGREDIENTS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest px-1">
                    Neural Ingredients
                  </span>
                  <button
                    onClick={handleRandomize}
                    className="text-indigo-400 hover:text-white p-1 rounded-md transition-colors"
                    title="Randomize"
                  >
                    <Dice5 size={12} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(ingredients).map(([cat, items]) =>
                    items.map(item => (
                      <button
                        key={item}
                        onClick={() => appendIngredient(item)}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[8px] text-slate-400 hover:text-indigo-300 transition-colors uppercase tracking-wider flex items-center gap-1 group"
                      >
                        <Plus
                          size={8}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                        {item}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !customPrompt.trim()}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-900/20"
              >
                {isGenerating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Wand2 size={16} />
                )}
                Auto-Generate
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest px-1">
                One-Click Recipes
              </span>
              <div className="flex flex-col gap-2">
                {oneClickHolidays.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => handleOneClick(h.prompt)}
                    className="px-4 py-3 bg-white/5 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 rounded-xl text-left transition-all group"
                  >
                    <span className="block text-[9px] font-bold text-slate-300 group-hover:text-white uppercase">
                      {h.name}
                    </span>
                    <span className="block text-[8px] text-slate-600 truncate mt-1">
                      {h.prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

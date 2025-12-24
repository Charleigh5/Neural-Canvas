import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sliders,
  Save,
  Check,
  X,
  Layout,
  CloudRain,
  Wind,
  Speaker,
  Type,
  Palette,
  Captions,
  Wand2,
  Loader2,
} from 'lucide-react';
import { ThemeConfig } from '../../types';
import { BEZEL_TEXTURES } from './constants';

interface ConfigurationLabProps {
  activeConfig: ThemeConfig;
  showCaptions: boolean;
  neuralTemperature: number;
  reelLength: number;
  onUpdateConfig: (updates: Partial<ThemeConfig>) => void;
  onToggleCaptions: () => void;
  onGenerateCaptions: () => void;
  onSaveTheme: (name: string) => void;
}

export const ConfigurationLab: React.FC<ConfigurationLabProps> = ({
  activeConfig,
  showCaptions,
  neuralTemperature,
  reelLength,
  onUpdateConfig,
  onToggleCaptions,
  onGenerateCaptions,
  onSaveTheme,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveName, setSaveName] = useState('');

  const handleSaveTheme = () => {
    if (!saveName.trim()) return;
    onSaveTheme(saveName);
    setSaveName('');
    setIsSaving(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a]">
      {/* Header */}
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
                aria-label="Confirm save"
                className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
              >
                <Check size={12} />
              </button>
              <button
                onClick={() => setIsSaving(false)}
                aria-label="Cancel save"
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

      {/* Controls Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="grid grid-cols-2 gap-8">
          {/* Visuals Column */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">
              Visual Acoustics
            </h3>

            {/* Bezel Material */}
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layout size={10} /> Bezel Material
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                  <input
                    type="color"
                    value={activeConfig.bezelColor || '#1a1a1a'}
                    onChange={e => onUpdateConfig({ bezelColor: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                    title="Base Color"
                  />
                  <span className="text-[9px] font-mono text-slate-500">Base Tint</span>
                </div>
                <select
                  value={activeConfig.bezelTexture || 'none'}
                  onChange={e => onUpdateConfig({ bezelTexture: e.target.value })}
                  aria-label="Select bezel texture"
                  className="bg-white/5 border border-white/5 rounded-xl p-2 text-[9px] text-white font-mono outline-none focus:border-indigo-500"
                >
                  {BEZEL_TEXTURES.map(tex => (
                    <option key={tex.id} value={tex.id}>
                      {tex.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Atmosphere */}
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <CloudRain size={10} /> Atmosphere
              </label>
              <select
                value={activeConfig.overlayType || 'none'}
                onChange={e =>
                  onUpdateConfig({ overlayType: e.target.value as ThemeConfig['overlayType'] })
                }
                aria-label="Select overlay type"
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

            {/* Particle Density */}
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
                onChange={e => onUpdateConfig({ particleDensity: parseInt(e.target.value) })}
                aria-label="Particle density"
                className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-fuchsia-500"
              />
            </div>
          </div>

          {/* Audio & Brand Column */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">
              Sensory & Brand
            </h3>

            {/* Audio Ambience */}
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Speaker size={10} /> Audio Ambience
              </label>
              <select
                value={activeConfig.audioAmbience || 'none'}
                onChange={e =>
                  onUpdateConfig({
                    audioAmbience: e.target.value as ThemeConfig['audioAmbience'],
                  })
                }
                aria-label="Select audio ambience"
                className="w-full bg-black border border-white/10 rounded-xl p-3 text-[10px] text-white font-black uppercase outline-none focus:border-indigo-500 transition-all"
              >
                <option value="none">Muted</option>
                <option value="holiday">Holiday Cheer</option>
                <option value="lofi">Lofi Chill</option>
                <option value="storm">Thunderstorm</option>
                <option value="cinematic">Deep Drone</option>
              </select>
            </div>

            {/* Typography */}
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Type size={10} /> Typography
              </label>
              <select
                value={activeConfig.fontFamily || 'Inter'}
                onChange={e => onUpdateConfig({ fontFamily: e.target.value })}
                aria-label="Select typography"
                className="w-full bg-black border border-white/10 rounded-xl p-3 text-[10px] text-white font-black uppercase outline-none focus:border-indigo-500 transition-all"
              >
                <option value="Inter">Modern Sans</option>
                <option value="serif">Editorial Serif</option>
                <option value="monospace">Tech Mono</option>
              </select>
            </div>

            {/* Accent Glow */}
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Palette size={10} /> Accent Glow
              </label>
              <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/5">
                <input
                  type="color"
                  value={activeConfig.accentColor || '#6366f1'}
                  onChange={e => onUpdateConfig({ accentColor: e.target.value })}
                  aria-label="Select accent color"
                  className="w-full h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                />
              </div>
            </div>

            {/* Narrative Layer */}
            <div className="space-y-3 border-t border-white/5 pt-4">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Captions size={10} /> Narrative Layer
              </label>

              <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/5">
                <span className="text-[9px] font-mono text-slate-500 pl-2">Show Captions</span>
                <div
                  onClick={onToggleCaptions}
                  className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${showCaptions ? 'bg-indigo-500' : 'bg-slate-700'}`}
                >
                  <motion.div
                    className="w-3 h-3 bg-white rounded-full shadow-sm"
                    animate={{ x: showCaptions ? 16 : 0 }}
                  />
                </div>
              </div>

              <button
                onClick={onGenerateCaptions}
                disabled={neuralTemperature > 0 || reelLength === 0}
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
  );
};

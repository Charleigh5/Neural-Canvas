import React, { useState } from 'react';
import { useThrottledCallback } from '../../hooks/useDebouncedCallback';
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
import { Select } from '../ui/Select';

interface ConfigurationLabProps {
  activeConfig: ThemeConfig;
  showCaptions: boolean;
  neuralTemperature: number;
  reelLength: number;
  currentCaption?: string;
  onUpdateConfig: (updates: Partial<ThemeConfig>) => void;
  onToggleCaptions: () => void;
  onGenerateCaptions: () => void;
  onUpdateCaption?: (text: string) => void;
  onRegenerateCaption?: () => void;
  onSaveTheme: (name: string) => void;
}

export const ConfigurationLab: React.FC<ConfigurationLabProps> = ({
  activeConfig,
  showCaptions,
  neuralTemperature,
  reelLength,
  currentCaption,
  onUpdateConfig,
  onToggleCaptions,
  onGenerateCaptions,
  onUpdateCaption,
  onRegenerateCaption,
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

  // Throttle slider updates to reduce re-renders during rapid dragging
  const throttledUpdateDensity = useThrottledCallback(
    (value: number) => onUpdateConfig({ particleDensity: value }),
    50
  );

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-gradient-to-r from-[#050505] to-indigo-950/20 backdrop-blur-3xl">
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
                // eslint-disable-next-line jsx-a11y/no-autofocus -- Save dialog: focus is expected UX
                autoFocus
              />
              <button
                onClick={handleSaveTheme}
                disabled={!saveName.trim()}
                aria-label="Confirm save"
                className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
                title="Save Theme"
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
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsSaving(true)}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:text-white hover:bg-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <Save size={14} /> Save Current
            </motion.button>
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
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layout size={10} /> Bezel Material
              </span>
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
                <Select
                  value={activeConfig.bezelTexture || 'none'}
                  onChange={(val: string) => onUpdateConfig({ bezelTexture: val })}
                  options={BEZEL_TEXTURES.map(tex => ({ value: tex.id, label: tex.name }))}
                />
              </div>
            </div>

            {/* Atmosphere */}
            <div className="space-y-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <CloudRain size={10} /> Atmosphere
              </span>
              <Select
                value={activeConfig.overlayType || 'none'}
                onChange={(val: string) =>
                  onUpdateConfig({ overlayType: val as ThemeConfig['overlayType'] })
                }
                options={[
                  { value: 'none', label: 'Clear' },
                  { value: 'snow', label: 'Blizzard' },
                  { value: 'rain', label: 'Rainfall' },
                  { value: 'dust', label: 'Floating Dust' },
                  { value: 'glitter', label: 'Glitter Shimmer' },
                  { value: 'embers', label: 'Fire Embers' },
                ]}
              />
            </div>

            {/* Particle Density */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Wind size={10} /> Particle Density
                </span>
                <span className="text-[9px] font-mono text-indigo-400">
                  {activeConfig.particleDensity || 0}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={activeConfig.particleDensity || 0}
                onChange={e => throttledUpdateDensity(parseInt(e.target.value))}
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
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Speaker size={10} /> Audio Ambience
              </span>
              <Select
                value={activeConfig.audioAmbience || 'none'}
                onChange={(val: string) =>
                  onUpdateConfig({
                    audioAmbience: val as ThemeConfig['audioAmbience'],
                  })
                }
                options={[
                  { value: 'none', label: 'Muted' },
                  { value: 'holiday', label: 'Holiday Cheer' },
                  { value: 'lofi', label: 'Lofi Chill' },
                  { value: 'storm', label: 'Thunderstorm' },
                  { value: 'cinematic', label: 'Deep Drone' },
                ]}
              />
            </div>

            {/* Typography */}
            <div className="space-y-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Type size={10} /> Typography
              </span>
              <Select
                value={activeConfig.fontFamily || 'Inter'}
                onChange={(val: string) => onUpdateConfig({ fontFamily: val })}
                options={[
                  { value: 'Inter', label: 'Modern Sans' },
                  { value: 'serif', label: 'Editorial Serif' },
                  { value: 'monospace', label: 'Tech Mono' },
                ]}
              />
            </div>

            {/* Accent Glow */}
            <div className="space-y-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Palette size={10} /> Accent Glow
              </span>
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
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Captions size={10} /> Narrative Layer
              </span>

              <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/5">
                <span className="text-[9px] font-mono text-slate-500 pl-2">Show Captions</span>
                {/* 
                  Per Deque axe-core rule aria-valid-attr-value:
                  aria-checked accepts only "true", "false", or "mixed" strings.
                  Using explicit ternary to satisfy static analysis.
                  Ref: https://dequeuniversity.com/rules/axe/4.11/aria-valid-attr-value
                */}
                <button
                  type="button"
                  role="switch"
                  onClick={onToggleCaptions}
                  aria-checked={showCaptions ? 'true' : 'false'}
                  aria-label="Toggle show captions"
                  className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${showCaptions ? 'bg-indigo-500' : 'bg-slate-700'}`}
                >
                  <motion.div
                    className="w-3 h-3 bg-white rounded-full shadow-sm"
                    animate={{ x: showCaptions ? 16 : 0 }}
                  />
                </button>
              </div>

              {/* Caption Editor */}
              {showCaptions && onUpdateCaption && (
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] text-slate-500 uppercase tracking-wider">
                      Current Frame Caption
                    </span>
                    {onRegenerateCaption && (
                      <button
                        onClick={onRegenerateCaption}
                        disabled={neuralTemperature > 0}
                        className="text-[8px] text-indigo-400 hover:text-white flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <Wand2 size={8} /> Regenerate
                      </button>
                    )}
                  </div>
                  <textarea
                    value={currentCaption || ''}
                    onChange={e => onUpdateCaption(e.target.value)}
                    placeholder={
                      currentCaption === undefined
                        ? 'Select an image to add a caption...'
                        : 'Enter caption text...'
                    }
                    className="w-full h-20 bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] text-white font-mono outline-none focus:border-indigo-500/50 resize-none"
                    disabled={currentCaption === undefined}
                  />
                </div>
              )}

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
                Generate All Captions (Batch)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Palette,
  Snowflake,
  PenTool,
  Ghost,
  Sun,
  Box,
  Grid,
  Layout,
  Upload,
  Loader2,
  Layers,
} from 'lucide-react';
import { ImageAsset } from '../../../types';

export const stylePresets = [
  {
    id: 'cyber',
    name: 'Cyberpunk',
    prompt:
      'Neural Cyberpunk Remix: Infuse with neon bioluminescence, rainy high-tech urban atmosphere, and chrome surfaces.',
    icon: Zap,
    color: 'text-cyan-400',
    glow: 'shadow-cyan-500/20',
  },
  {
    id: 'oil',
    name: 'Oil Painting',
    prompt:
      'Classical Oil Painting: Re-render with thick impasto brushstrokes, rich pigment textures, and dramatic chiaroscuro lighting.',
    icon: Palette,
    color: 'text-amber-500',
    glow: 'shadow-amber-500/20',
  },
  {
    id: 'festive',
    name: 'Festive Magic',
    prompt:
      'Holiday Enchantment: Add warm glowing bokeh, magical snowflakes, and a cozy cinematic Christmas atmosphere.',
    icon: Snowflake,
    color: 'text-rose-400',
    glow: 'shadow-rose-500/20',
  },
  {
    id: 'sketch',
    name: 'Ink Sketch',
    prompt:
      'Architectural Ink Sketch: Convert to a detailed hand-drawn ink and charcoal illustration on vintage paper.',
    icon: PenTool,
    color: 'text-slate-400',
    glow: 'shadow-slate-500/20',
  },
  {
    id: 'ghibli',
    name: 'Anime Studio',
    prompt:
      'Nostalgic Anime Style: Transform into a lush, hand-painted Ghibli-inspired world with vibrant blues and fluffy clouds.',
    icon: Ghost,
    color: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  {
    id: 'vapor',
    name: 'Vaporwave',
    prompt:
      'Vaporwave Aesthetic: Apply a surreal retro-future remix with pink/purple gradients, digital artifacts, and lo-fi glow.',
    icon: Sun,
    color: 'text-fuchsia-400',
    glow: 'shadow-fuchsia-500/20',
  },
  {
    id: 'clay',
    name: 'Claymation',
    prompt:
      'Plasticine Stop-Motion: Render as a tactile clay model with soft fingerprints, rounded edges, and studio lighting.',
    icon: Box,
    color: 'text-orange-400',
    glow: 'shadow-orange-500/20',
  },
  {
    id: 'pixel',
    name: 'Pixel Art',
    prompt:
      '16-bit Pixel Art: Convert to a retro high-quality pixel art style with a limited color palette and dithering.',
    icon: Grid,
    color: 'text-fuchsia-400',
    glow: 'shadow-fuchsia-500/20',
  },
];

interface StyleTabProps {
  image: ImageAsset;
  images: ImageAsset[];
  // State from useForge
  showCanvasPicker: boolean;
  setShowCanvasPicker: (show: boolean) => void;
  styleRefBase64: string | null;
  setStyleRefBase64: (base64: string | null) => void;
  styleRefMimeType: string;
  styleIntensity: number;
  setStyleIntensity: (val: number) => void;

  // Handlers and Refs
  prompt: string;
  command: string;
  neuralTemperature: number;
  handleCanvasStyleSelect: (img: ImageAsset) => void;
  handleStyleUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleApplyStyle: (promptOverride?: string) => void;
  styleInputRef: React.RefObject<HTMLInputElement | null>;
}

export const StyleTab: React.FC<StyleTabProps> = ({
  image,
  images,
  showCanvasPicker,
  setShowCanvasPicker,
  styleRefBase64,
  setStyleRefBase64,
  styleRefMimeType,
  styleIntensity,
  setStyleIntensity,
  prompt,
  command,
  neuralTemperature,
  handleCanvasStyleSelect,
  handleStyleUpload,
  handleApplyStyle,
  styleInputRef,
}) => {
  return (
    <motion.div
      key="style"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {showCanvasPicker ? (
        <div className="space-y-3 animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black uppercase text-indigo-400 tracking-[0.2em]">
              Select Source
            </span>
            <button
              onClick={() => setShowCanvasPicker(false)}
              className="text-[8px] uppercase text-slate-500 hover:text-white"
            >
              Cancel
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {images
              .filter(i => i.id !== image.id)
              .map(img => (
                <motion.button
                  key={img.id}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleCanvasStyleSelect(img)}
                  className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-white/10 group"
                >
                  <img
                    src={img.url}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                    alt={img.tags?.[0] || 'Style reference'}
                  />
                </motion.button>
              ))}
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black uppercase text-indigo-400 tracking-[0.2em]">
                Neural Style Fusion
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {stylePresets.map(s => (
                <motion.button
                  key={s.id}
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    y: -2,
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  onClick={() => handleApplyStyle(s.prompt)}
                  className={`relative p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-2 group transition-all shadow-lg ${s.glow}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none rounded-2xl" />
                  <s.icon
                    size={20}
                    className={`${s.color} group-hover:scale-110 transition-transform`}
                  />
                  <span className="text-[9px] font-black uppercase text-slate-300 tracking-[0.1em] group-hover:text-white text-center">
                    {s.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="h-px bg-white/10 my-2" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black uppercase text-indigo-400 tracking-[0.2em]">
                Custom Reference
              </span>
              {styleRefBase64 && (
                <motion.button
                  whileHover={{ scale: 1.1, color: '#f43f5e' }}
                  onClick={() => setStyleRefBase64(null)}
                  className="text-[8px] text-rose-500/60 hover:text-rose-500 font-black uppercase transition-colors"
                >
                  Clear_Reference
                </motion.button>
              )}
            </div>

            <div className="flex gap-2">
              <motion.button
                onClick={() => setShowCanvasPicker(true)}
                whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
                className="flex-1 py-3 border border-dashed border-indigo-500/30 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-indigo-500/60 transition-all group"
              >
                <Layout
                  size={14}
                  className="text-indigo-400 group-hover:scale-110 transition-transform"
                />
                <span className="text-[8px] font-black uppercase text-slate-500 group-hover:text-indigo-300">
                  From Canvas
                </span>
              </motion.button>
              <motion.button
                onClick={() => styleInputRef.current?.click()}
                whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
                className="flex-1 py-3 border border-dashed border-indigo-500/30 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-indigo-500/60 transition-all group"
              >
                <Upload
                  size={14}
                  className="text-indigo-400 group-hover:scale-110 transition-transform"
                />
                <span className="text-[8px] font-black uppercase text-slate-500 group-hover:text-indigo-300">
                  Upload File
                </span>
              </motion.button>
              <input
                type="file"
                ref={styleInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleStyleUpload}
                aria-label="Upload style reference image"
              />
            </div>

            {styleRefBase64 && (
              <div className="relative aspect-[4/1] w-full bg-slate-900 border border-indigo-500/50 rounded-lg overflow-hidden">
                <img
                  src={`data:${styleRefMimeType};base64,${styleRefBase64}`}
                  className="w-full h-full object-cover opacity-60"
                  alt="Style reference preview"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="text-[8px] font-black text-white uppercase tracking-widest bg-indigo-600/80 px-2 py-0.5 rounded shadow-sm">
                    Reference Active
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2 group/slider">
              <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                <span className="uppercase tracking-widest group-hover/slider:text-slate-300 transition-colors">
                  Fusion_Intensity
                </span>
                <span className="text-indigo-400 font-black">
                  {Math.round(styleIntensity * 100)}%
                </span>
              </div>
              {/* CSS variable for slider track - dynamic style required for slider positioning */}
              <div
                className="h-1 bg-white/10 rounded-full relative cursor-pointer group"
                style={
                  {
                    '--slider-pct': `${((styleIntensity - 0.1) / (1.0 - 0.1)) * 100}%`,
                  } as React.CSSProperties
                }
              >
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={styleIntensity}
                  onChange={e => setStyleIntensity(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                  aria-label="Style Fusion Intensity"
                />
                <div className="h-full bg-indigo-500 rounded-full group-hover:bg-indigo-400 transition-all duration-200 shadow-[0_0_10px_rgba(99,102,241,0.5)] w-[var(--slider-pct)]" />
                <div className="absolute top-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:scale-125 left-[var(--slider-pct)] -translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{
              scale: 1.02,
              y: -2,
              backgroundColor: 'rgba(99, 102, 241, 1)',
              boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)',
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={() => handleApplyStyle()}
            disabled={
              (!styleRefBase64 && !prompt.trim() && !command.trim()) || neuralTemperature > 0
            }
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white rounded-full flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl transition-all disabled:opacity-30"
          >
            {neuralTemperature > 0 ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Layers size={16} />
            )}
            Initiate_Fusion
          </motion.button>
        </>
      )}
    </motion.div>
  );
};

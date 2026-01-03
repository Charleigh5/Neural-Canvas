import React from 'react';
import { motion } from 'framer-motion';
import { Maximize2, Sparkles, Loader2 } from 'lucide-react';

interface UpscaleTabProps {
  creativity: number;
  setCreativity: (val: number) => void;
  onUpscale: () => void;
  neuralTemperature: number;
}

export const UpscaleTab: React.FC<UpscaleTabProps> = ({
  creativity,
  setCreativity,
  onUpscale,
  neuralTemperature,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 text-center"
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="p-6 border-2 border-dashed border-indigo-500/20 bg-indigo-500/5 rounded-3xl flex flex-col items-center gap-4 transition-colors"
      >
        <div className="w-16 h-16 rounded-full bg-indigo-600/10 flex items-center justify-center text-indigo-400">
          <Maximize2 size={32} />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">
            Neural_4K_Upscale
          </h3>
          <p className="text-[9px] font-mono text-slate-500 uppercase leading-relaxed">
            Synthesize high-frequency detail using Gemini 3 Pro Vision.
          </p>
        </div>
      </motion.div>

      <div className="space-y-2 px-2">
        <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
          <span className="uppercase tracking-widest">Detail_Synthesis</span>
          <span className="text-indigo-400 font-black">{Math.round(creativity * 100)}%</span>
        </div>
        {/* Dynamic CSS variable for slider - required for slider positioning */}
        <div
          className="h-1 bg-slate-800 rounded-full relative"
          style={{ '--slider-pct': `${creativity * 100}%` } as React.CSSProperties}
        >
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={creativity}
            onChange={e => setCreativity(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
            aria-label="Detail Synthesis Level"
          />
          <div className="h-full bg-indigo-500 rounded-full transition-all duration-200 shadow-[0_0_10px_rgba(99,102,241,0.5)] w-[var(--slider-pct)]" />
          <div className="absolute top-1/2 w-3 h-3 bg-white rounded-full shadow-md pointer-events-none transition-all duration-200 left-[var(--slider-pct)] -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="flex justify-between text-[7px] text-slate-600 uppercase font-black tracking-widest pt-1">
          <span>Strict Fidelity</span>
          <span>Hallucinate Detail</span>
        </div>
      </div>

      <motion.button
        whileHover={{
          scale: 1.02,
          y: -2,
          backgroundColor: 'rgba(79, 70, 229, 1)',
          boxShadow: '0 10px 40px rgba(99, 102, 241, 0.5)',
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        onClick={onUpscale}
        disabled={neuralTemperature > 0}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-full flex items-center justify-center gap-3 text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl disabled:opacity-30"
      >
        {neuralTemperature > 0 ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Sparkles size={18} />
        )}
        Initiate_4K_Forge
      </motion.button>
    </motion.div>
  );
};

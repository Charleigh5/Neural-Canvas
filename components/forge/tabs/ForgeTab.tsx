import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Film, Moon, Sun, CloudLightning, Loader2, Lightbulb } from 'lucide-react';

interface ForgeTabProps {
  prompt: string;
  setPrompt: (value: string) => void;
  isRefining: boolean;
  handleRefinePrompt: () => void;
  handleApplyEdit: (promptOverride?: string) => void;
  neuralTemperature: number;
}

export const ForgeTab: React.FC<ForgeTabProps> = ({
  prompt,
  setPrompt,
  isRefining,
  handleRefinePrompt,
  handleApplyEdit,
  neuralTemperature,
}) => {
  const neuralPresets = [
    {
      id: 'hdr',
      name: 'Ultra HDR',
      prompt:
        'Enhance details, expand color range, and optimize micro-contrast for a vivid high-dynamic-range look.',
      icon: Zap,
      color: 'text-cyan-400',
    },
    {
      id: 'cine',
      name: 'Cinematic',
      prompt: 'Enhance the colors and add a cinematic bokeh effect with soft volumetric lighting.',
      icon: Film,
      color: 'text-fuchsia-400',
    },
    {
      id: 'night',
      name: 'Moonlight',
      prompt:
        'Transform into a serene moonlit night scene with deep blue shadows and soft volumetric light.',
      icon: Moon,
      color: 'text-indigo-400',
    },
    {
      id: 'sunset',
      name: 'Golden Hour',
      prompt:
        'Apply warm cinematic sunset lighting with long shadows and a glowing atmospheric haze.',
      icon: Sun,
      color: 'text-amber-500',
    },
    {
      id: 'storm',
      name: 'Stormy',
      prompt:
        'Moody storm atmosphere: dramatic dark clouds, cool color grading, and dynamic high-contrast lighting.',
      icon: CloudLightning,
      color: 'text-slate-400',
    },
  ];

  return (
    <motion.div
      key="forge"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-black uppercase text-indigo-400 tracking-[0.2em]">
            Neural Presets
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {neuralPresets.map(action => (
            <motion.button
              key={action.id}
              whileHover={{
                scale: 1.02,
                backgroundColor: 'rgba(255,255,255,0.08)',
                x: 4,
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              onClick={() => handleApplyEdit(action.prompt)}
              className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 transition-all text-left"
            >
              <action.icon size={16} className={action.color} />
              <span className="text-[9px] font-black uppercase text-slate-300 tracking-wider">
                {action.name}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="h-px bg-white/10 my-1" />

      <div className="relative group">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Describe a full custom visual transformation..."
          className="w-full h-24 bg-black/60 border border-white/10 rounded-2xl p-4 text-[11px] font-mono text-white outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 resize-none shadow-inner transition-all"
        />
        <motion.button
          whileHover={{ scale: 1.1, y: -1, backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
          whileTap={{ scale: 0.9 }}
          onClick={handleRefinePrompt}
          disabled={!prompt.trim() || isRefining}
          className="absolute bottom-3 right-3 p-2 bg-indigo-500/10 text-indigo-400 rounded-lg transition-all disabled:opacity-0"
        >
          {isRefining ? <Loader2 size={14} className="animate-spin" /> : <Lightbulb size={14} />}
        </motion.button>
      </div>
      <motion.button
        whileHover={{
          scale: 1.02,
          y: -2,
          backgroundColor: 'rgba(79, 70, 229, 0.9)',
          boxShadow: '0 10px 30px rgba(79, 70, 229, 0.4)',
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        onClick={() => handleApplyEdit()}
        disabled={!prompt.trim() || neuralTemperature > 0}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all shadow-xl disabled:opacity-30"
      >
        {neuralTemperature > 0 ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Sparkles size={16} />
        )}
        Execute_Neural_Remix
      </motion.button>
    </motion.div>
  );
};

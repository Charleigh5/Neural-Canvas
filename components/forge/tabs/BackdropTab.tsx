import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, Sparkles, Loader2 } from 'lucide-react';

interface BackdropTabProps {
  onGenerate: () => void;
  neuralTemperature: number;
}

export const BackdropTab: React.FC<BackdropTabProps> = ({ onGenerate, neuralTemperature }) => {
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
          <Monitor size={32} />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">
            Ambient_Synthesis
          </h3>
          <p className="text-[9px] font-mono text-slate-500 uppercase leading-relaxed">
            Generate a 16:9 cinematic backdrop derived from the semantic DNA of this asset.
          </p>
        </div>
      </motion.div>

      <motion.button
        whileHover={{
          scale: 1.02,
          y: -2,
          backgroundColor: 'rgba(79, 70, 229, 1)',
          boxShadow: '0 10px 40px rgba(99, 102, 241, 0.5)',
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        onClick={onGenerate}
        disabled={neuralTemperature > 0}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-full flex items-center justify-center gap-3 text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl disabled:opacity-30"
      >
        {neuralTemperature > 0 ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Sparkles size={18} />
        )}
        Generate_Backdrop
      </motion.button>
    </motion.div>
  );
};

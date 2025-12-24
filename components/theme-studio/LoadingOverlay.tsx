import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
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
  );
};

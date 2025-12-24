
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Mic, Brain, Volume2, Sparkles } from 'lucide-react';

export const LiveDirector: React.FC = () => {
  const { ui, isCameraOpen } = useStore();
  const { isLiveActive, liveStatus } = ui;

  const getStatusColor = () => {
    switch (liveStatus) {
      case 'listening': return 'text-cyan-400';
      case 'thinking': return 'text-indigo-400';
      case 'speaking': return 'text-emerald-400';
      default: return 'text-slate-500';
    }
  };

  const getStatusGlow = () => {
    switch (liveStatus) {
      case 'listening': return 'shadow-[0_0_30px_rgba(34,211,238,0.4)]';
      case 'thinking': return 'shadow-[0_0_30px_rgba(129,140,248,0.4)]';
      case 'speaking': return 'shadow-[0_0_30px_rgba(16,185,129,0.4)]';
      default: return '';
    }
  };

  return (
    <div className={`fixed ${isCameraOpen ? 'bottom-[420px]' : 'bottom-[200px]'} right-10 z-[200] flex flex-col items-center gap-6 pointer-events-none`}>
      <AnimatePresence>
        {isLiveActive && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="flex flex-col items-center gap-2 pointer-events-auto"
          >
             {/* DIRECTOR'S ORB */}
             <div className={`relative w-20 h-20 rounded-full bg-slate-900 border-2 border-white/10 flex items-center justify-center backdrop-blur-3xl transition-all duration-500 ${getStatusGlow()}`}>
                
                {/* Internal Energy Mesh */}
                <motion.div 
                    className={`absolute inset-2 rounded-full border border-current opacity-20 ${getStatusColor()}`}
                    animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />

                {/* Status Icon */}
                {liveStatus === 'listening' && <Mic className="text-cyan-400 animate-pulse" size={24} />}
                {liveStatus === 'thinking' && <Brain className="text-indigo-400 animate-bounce" size={24} />}
                {liveStatus === 'speaking' && <Volume2 className="text-emerald-400 scale-125" size={24} />}
                {liveStatus === 'idle' && <Sparkles className="text-slate-500" size={24} />}

                {/* Scanning Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <motion.circle 
                        cx="40" cy="40" r="38"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className={getStatusColor()}
                        strokeDasharray="238"
                        animate={{ strokeDashoffset: [238, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                </svg>
             </div>

             <div className="bg-slate-900/80 border border-white/5 px-3 py-1 rounded-full backdrop-blur-md">
                <span className={`text-[10px] font-mono font-black uppercase tracking-[0.2em] ${getStatusColor()}`}>
                    Director::{liveStatus}
                </span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

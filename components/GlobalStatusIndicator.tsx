import React from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Activity, Moon } from 'lucide-react';

export const GlobalStatusIndicator: React.FC = () => {
  const { isAnalysisRunning, neuralTemperature, processingIds, ui, apiStatus, apiStatusMessage } =
    useStore();

  const isOrchestrating = neuralTemperature > 40; // High temp usually means heavy AI work like orchestration
  const queueLength = processingIds.length;
  const isRateLimited = apiStatus === 'rate-limited';
  const isThinking =
    !isRateLimited && (isAnalysisRunning || isOrchestrating || ui.liveStatus === 'thinking');

  return (
    <div className="fixed top-6 right-6 z-[300] flex flex-col items-end gap-3 pointer-events-none">
      {/* AI SLEEPING INDICATOR */}
      <AnimatePresence>
        {isRateLimited && (
          <motion.div
            initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
            className="flex items-center gap-4 bg-black/40 backdrop-blur-2xl border border-amber-500/20 px-4 py-2 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.1)]"
          >
            <div className="relative">
              <Moon size={16} className="text-amber-400" />
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-amber-500/20 rounded-full blur-md"
              />
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-[0.2em]">
                AI Sleeping
              </span>
              <span className="text-[8px] font-mono text-amber-400/60 uppercase">
                {apiStatusMessage || 'Using local tags'}
              </span>
            </div>

            <div className="h-4 w-px bg-amber-500/20" />

            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono text-amber-500/80">⚡ LOCAL</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NEURAL ANALYSIS INDICATOR */}
      <AnimatePresence>
        {isThinking && (
          <motion.div
            initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
            className="flex items-center gap-4 bg-black/40 backdrop-blur-2xl border border-indigo-500/20 px-4 py-2 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.1)]"
          >
            <div className="relative">
              <Loader2 size={16} className="text-indigo-400 animate-spin" />
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-indigo-500/20 rounded-full blur-md"
              />
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">
                {isOrchestrating
                  ? 'AI Director Active'
                  : isAnalysisRunning
                    ? 'Neural Analysis'
                    : 'System Thinking'}
              </span>
              {queueLength > 0 && (
                <span className="text-[8px] font-mono text-indigo-400/60 uppercase">
                  {queueLength} Assets in Queue
                </span>
              )}
            </div>

            <div className="h-4 w-px bg-white/10" />

            <div className="flex items-center gap-2">
              <Activity size={10} className="text-emerald-500 animate-pulse" />
              <span className="text-[8px] font-mono text-emerald-500/80">
                {neuralTemperature.toFixed(0)}°C
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ui.toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-2xl text-[10px] font-bold uppercase tracking-widest border border-white/20 pointer-events-auto"
          >
            {ui.toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

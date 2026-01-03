import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { governor } from '../services/geminiService';

/**
 * RateLimitBanner
 *
 * Displays a subtle but visible warning when the Gemini API is in quarantine mode
 * (rate limited). Shows countdown timer and current RPM.
 */
export const RateLimitBanner: React.FC = () => {
  const [quarantine, setQuarantine] = useState({
    isQuarantined: false,
    remainingMs: 0,
    currentRpm: 10,
  });

  useEffect(() => {
    // Poll quarantine status every second
    const interval = setInterval(() => {
      const info = governor.getQuarantineInfo();
      setQuarantine(info);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <AnimatePresence>
      {quarantine.isQuarantined && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100]"
          data-testid="rate-limit-banner"
        >
          <div className="flex items-center gap-3 px-6 py-3 bg-amber-500/10 border border-amber-500/30 rounded-full backdrop-blur-xl shadow-lg">
            <AlertTriangle size={18} className="text-amber-400 animate-pulse" />
            <span className="text-sm font-medium text-amber-200">API Cooldown Active</span>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-black/30 rounded-full">
              <Clock size={14} className="text-amber-400" />
              <span className="text-xs font-mono text-amber-300">
                {formatTime(quarantine.remainingMs)}
              </span>
            </div>
            <span className="text-xs text-slate-500 font-mono">{quarantine.currentRpm} RPM</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

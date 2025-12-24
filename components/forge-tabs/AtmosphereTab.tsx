import React from 'react';
import { motion } from 'framer-motion';
import { ATMOSPHERE_PRESETS } from './constants';

interface AtmosphereTabProps {
  onFestiveTrigger: (mode: 'snow' | 'lights' | 'magic') => void;
  onClose: () => void;
}

export const AtmosphereTab: React.FC<AtmosphereTabProps> = ({ onFestiveTrigger, onClose }) => {
  return (
    <motion.div
      key="atmosphere"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-1 gap-3"
    >
      {ATMOSPHERE_PRESETS.map(atm => (
        <motion.button
          key={atm.id}
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(79, 70, 229, 0.15)', x: 6 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onClick={() => {
            onFestiveTrigger(atm.mode);
            onClose();
          }}
          className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white group-hover:scale-110 transition-all shadow-lg">
            <atm.icon size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase text-white tracking-widest group-hover:text-indigo-400 transition-colors">
              {atm.name}
            </span>
            <span className="text-[9px] font-mono text-slate-500 uppercase">{atm.desc}</span>
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
};

import React from 'react';
import { motion } from 'framer-motion';
import { CAMERA_ANGLE_PRESETS } from './constants';

interface CameraTabProps {
  onApplyEdit: (prompt: string) => void;
}

export const CameraTab: React.FC<CameraTabProps> = ({ onApplyEdit }) => {
  return (
    <motion.div
      key="camera"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-black uppercase text-indigo-400 tracking-[0.2em]">
          Cinematic Re-Framing
        </span>
      </div>
      <div className="space-y-2">
        {CAMERA_ANGLE_PRESETS.map(angle => (
          <motion.button
            key={angle.id}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)', x: 4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={() => onApplyEdit(angle.prompt)}
            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-4 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center border border-white/5">
              <angle.icon size={18} className={angle.color} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider group-hover:text-white block mb-0.5">
                {angle.name}
              </span>
              <span className="text-[8px] font-mono text-slate-600 uppercase tracking-tight opacity-70">
                AI Re-Framing Protocol
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

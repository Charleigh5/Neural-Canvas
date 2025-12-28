import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, ArrowUp, ArrowDown, Maximize2, Focus } from 'lucide-react';

interface CameraTabProps {
  onSelect: (prompt: string) => void;
}

export const CameraTab: React.FC<CameraTabProps> = ({ onSelect }) => {
  const cameraAngles = [
    {
      id: 'dutch',
      name: 'Dutch Angle',
      prompt:
        'Remix this image with a dramatic Dutch Angle (tilted horizon) to create dynamic tension and energy.',
      icon: RotateCcw,
      color: 'text-orange-400',
    },
    {
      id: 'low',
      name: 'Low Angle',
      prompt:
        "Remix this image from a low angle looking up (worm's-eye view) to make the subject appear powerful and imposing.",
      icon: ArrowUp,
      color: 'text-indigo-400',
    },
    {
      id: 'overhead',
      name: 'Overhead',
      prompt:
        "Remix this image from a direct top-down overhead perspective (God's eye view/Flat Lay).",
      icon: ArrowDown,
      color: 'text-cyan-400',
    },
    {
      id: 'wide',
      name: 'Ultra Wide',
      prompt:
        'Remix this image using a wide-angle lens to show more of the surrounding environment and create depth.',
      icon: Maximize2,
      color: 'text-emerald-400',
    },
    {
      id: 'close',
      name: 'Extreme Close-Up',
      prompt:
        'Remix this image as an extreme close-up detail shot, focusing intensely on the texture and features.',
      icon: Focus,
      color: 'text-rose-400',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="space-y-1">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
          Cinematic Perspectives
        </h3>
        <p className="text-[9px] font-mono text-slate-600 px-1">
          Neural re-projection of the scene geometry.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {cameraAngles.map(angle => (
          <motion.button
            key={angle.id}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)', x: 4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={() => onSelect(angle.prompt)}
            className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-4 transition-all text-left group"
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

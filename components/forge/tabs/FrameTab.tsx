import React from 'react';
import { motion } from 'framer-motion';
import { Scan, BrainCircuit, Loader2, Crop, Focus, LayoutGrid, Ratio, Undo2 } from 'lucide-react';
import { ImageAsset } from '../../../types';

interface FrameTabProps {
  image: ImageAsset;
  reanalyzeImage: (id: string) => void;
  applyCompositionRule: (id: string, rule: 'center' | 'thirds' | 'golden') => void;
  resetCrop: (id: string) => void;
  neuralTemperature: number;
  onClose: () => void;
}

export const FrameTab: React.FC<FrameTabProps> = ({
  image,
  reanalyzeImage,
  applyCompositionRule,
  resetCrop,
  neuralTemperature,
  onClose,
}) => {
  const hasAnalysis = !!image.composition;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-5 space-y-6"
    >
      {!hasAnalysis ? (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-white/5 rounded-2xl border border-white/10">
          <Scan size={32} className="text-indigo-400" />
          <div className="space-y-1">
            <h3 className="text-sm font-black uppercase text-white tracking-widest">
              Composition_Unknown
            </h3>
            <p className="text-[9px] font-mono text-slate-500">
              Run deep analysis to unlock smart framing.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => reanalyzeImage(image.id)}
            disabled={neuralTemperature > 0}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            {neuralTemperature > 0 ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <BrainCircuit size={12} />
            )}
            Analyze_Asset
          </motion.button>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full border-2 border-indigo-500 flex items-center justify-center text-indigo-400 bg-indigo-500/10">
                <span className="text-lg font-black">
                  {Math.round((image.composition?.aestheticScore || 0) * 10)}
                </span>
              </div>
              <span className="text-[7px] font-black uppercase text-indigo-300 tracking-widest">
                Score
              </span>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center border-b border-indigo-500/20 pb-1">
                <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">
                  AI_Advisory
                </span>
                <span className="text-[8px] font-mono text-slate-400 uppercase bg-black/20 px-2 py-0.5 rounded">
                  {image.composition?.dominant_rule || 'Unstructured'}
                </span>
              </div>
              <p className="text-[9px] font-mono text-slate-300 leading-relaxed opacity-90">
                {image.composition?.improvementAdvisory ||
                  'Composition looks solid. Try exploring alternative crops for cinematic impact.'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
              <Crop size={10} /> Smart Re-Framing
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  applyCompositionRule(image.id, 'center');
                  onClose();
                }}
                className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center gap-2 hover:bg-white/10 hover:border-white/20 transition-all group"
              >
                <Focus
                  size={18}
                  className="text-cyan-400 group-hover:scale-110 transition-transform"
                />
                <span className="text-[8px] font-black uppercase text-slate-400 group-hover:text-white tracking-wider">
                  Center
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  applyCompositionRule(image.id, 'thirds');
                  onClose();
                }}
                className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center gap-2 hover:bg-white/10 hover:border-white/20 transition-all group"
              >
                <LayoutGrid
                  size={18}
                  className="text-emerald-400 group-hover:scale-110 transition-transform"
                />
                <span className="text-[8px] font-black uppercase text-slate-400 group-hover:text-white tracking-wider">
                  Thirds
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  applyCompositionRule(image.id, 'golden');
                  onClose();
                }}
                className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center gap-2 hover:bg-white/10 hover:border-white/20 transition-all group"
              >
                <Ratio
                  size={18}
                  className="text-amber-400 group-hover:scale-110 transition-transform"
                />
                <span className="text-[8px] font-black uppercase text-slate-400 group-hover:text-white tracking-wider">
                  Golden
                </span>
              </motion.button>
            </div>
          </div>

          <div className="flex items-center justify-center pt-2">
            <button
              onClick={() => {
                resetCrop(image.id);
                onClose();
              }}
              className="text-[9px] font-mono text-rose-500 hover:text-rose-400 uppercase tracking-widest flex items-center gap-2"
            >
              <Undo2 size={10} /> Reset_Original_Ratio
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface ReelLibraryProps {
  isOpen: boolean;
}

export const ReelLibrary: React.FC<ReelLibraryProps> = ({ isOpen }) => {
  const { savedReels, loadReel, deleteReel } = useStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 160, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-[#020202] border-b border-white/10 overflow-hidden relative z-40"
        >
          <div className="flex gap-4 p-6 overflow-x-auto custom-scrollbar h-full items-center">
            {savedReels.length === 0 ? (
              <div className="text-slate-600 text-xs font-mono uppercase tracking-widest w-full text-center">
                No Saved Reels Found
              </div>
            ) : (
              savedReels.map(reel => (
                <div
                  key={reel.id}
                  className="group relative shrink-0 w-40 cursor-pointer"
                  onClick={() => loadReel(reel.id)}
                >
                  <div className="aspect-video bg-slate-900 rounded-lg border border-white/10 overflow-hidden group-hover:border-indigo-500/50 transition-colors">
                    {reel.thumbnailUrl ? (
                      <img
                        src={reel.thumbnailUrl}
                        alt={`Thumbnail for ${reel.name} reel`}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <Film size={24} />
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex justify-between items-start">
                    <div>
                      <div className="text-[10px] font-bold text-slate-300 group-hover:text-white truncate max-w-[120px]">
                        {reel.name}
                      </div>
                      <div className="text-[8px] font-mono text-slate-600">
                        {reel.itemIds.length} Items
                      </div>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        deleteReel(reel.id);
                      }}
                      className="text-slate-600 hover:text-rose-500 transition-colors"
                      aria-label={`Delete ${reel.name} reel`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

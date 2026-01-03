import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface SaveReelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SaveReelModal: React.FC<SaveReelModalProps> = ({ isOpen, onClose }) => {
  const { savedReels, saveReel } = useStore();

  const [newReelName, setNewReelName] = useState('');
  const [overwriteTargetId, setOverwriteTargetId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSaveRequest = () => {
    const name = newReelName.trim();
    if (!name) return;

    const existing = savedReels.find(r => r.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      setOverwriteTargetId(existing.id);
    } else {
      performSave(name);
    }
  };

  const performSave = (name: string, id?: string) => {
    try {
      saveReel(name, id);
      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        setNewReelName('');
        setOverwriteTargetId(null);
        onClose();
      }, 1500);
    } catch {
      setSaveStatus('error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl w-96 flex flex-col gap-4 overflow-hidden"
        >
          {saveStatus === 'success' ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center py-6 text-emerald-500"
            >
              <CheckCircle2 size={48} className="mb-2" />
              <span className="text-xs font-black uppercase tracking-widest">Reel Secure</span>
            </motion.div>
          ) : overwriteTargetId ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-amber-500 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                <AlertTriangle size={20} />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Conflict Detected
                  </span>
                  <span className="text-[9px] font-mono opacity-80">
                    A reel named &apos;{newReelName}&apos; already exists.
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setOverwriteTargetId(null)}
                  className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => performSave(newReelName, overwriteTargetId)}
                  className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white transition-colors"
                >
                  Overwrite
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest">
                <span>Persist Sequence</span>
                <button
                  onClick={onClose}
                  className="hover:text-white"
                  aria-label="Close save dialog"
                >
                  <X size={14} />
                </button>
              </div>
              <input
                type="text"
                placeholder="Enter unique designation..."
                value={newReelName}
                onChange={e => setNewReelName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveRequest()}
                className="bg-black border border-white/10 rounded-xl p-3 text-xs font-mono text-white focus:border-indigo-500 outline-none shadow-inner"
              />
              <button
                onClick={handleSaveRequest}
                disabled={!newReelName.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
              >
                Confirm Save
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

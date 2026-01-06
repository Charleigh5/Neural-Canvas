import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import {
  Plus,
  Trash2,
  X,
  Film,
  Layers,
  Tag,
  BrainCircuit,
  Crop,
  Wand2,
  Check,
  Cuboid,
} from 'lucide-react';

export const SelectionToolbar: React.FC = () => {
  const {
    selectedIds,
    setSelectedIds,
    addToReel,
    playSelectedAssets,
    removeImage,
    batchAddTags,
    batchAnalyze,
    batchSmartCrop,
    batchEdit,
    batchGenerateDepthMaps,
  } = useStore();

  const [showBatchMenu, setShowBatchMenu] = useState(false);
  const [batchMode, setBatchMode] = useState<'none' | 'tag' | 'edit'>('none');
  const [inputValue, setInputValue] = useState('');

  if (selectedIds.length === 0) return null;

  const handleClear = () => {
    setSelectedIds([]);
    setShowBatchMenu(false);
    setBatchMode('none');
    setInputValue('');
  };

  const handleAddToReel = () => {
    addToReel(selectedIds);
    handleClear();
  };

  const handleInstantHighlight = () => {
    playSelectedAssets();
  };

  const handleDelete = () => {
    if (confirm(`Purge ${selectedIds.length} assets from neural memory?`)) {
      selectedIds.forEach(id => removeImage(id));
      handleClear();
    }
  };

  const executeBatch = async () => {
    if (!inputValue.trim() && (batchMode === 'tag' || batchMode === 'edit')) return;

    if (batchMode === 'tag') {
      batchAddTags(selectedIds, inputValue);
    } else if (batchMode === 'edit') {
      await batchEdit(selectedIds, inputValue);
    }

    setInputValue('');
    setBatchMode('none');
    setShowBatchMenu(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed bottom-32 left-1/2 z-[300] -translate-x-1/2 flex flex-col items-center gap-3">
        {/* BATCH MENU DROPDOWN */}
        <AnimatePresence>
          {showBatchMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="glass-panel p-3 mb-2 min-w-[320px] rounded-2xl"
            >
              {batchMode === 'none' ? (
                <div className="grid grid-cols-5 gap-2">
                  <BatchActionBtn icon={Tag} label="Tag" onClick={() => setBatchMode('tag')} />
                  <BatchActionBtn
                    icon={BrainCircuit}
                    label="Analyze"
                    onClick={() => {
                      batchAnalyze(selectedIds);
                      setShowBatchMenu(false);
                    }}
                  />
                  <BatchActionBtn
                    icon={Crop}
                    label="Crop"
                    onClick={() => {
                      batchSmartCrop(selectedIds);
                      setShowBatchMenu(false);
                    }}
                  />
                  <BatchActionBtn
                    icon={Cuboid}
                    label="Depth"
                    onClick={() => {
                      batchGenerateDepthMaps(selectedIds);
                      setShowBatchMenu(false);
                    }}
                  />
                  <BatchActionBtn icon={Wand2} label="Remix" onClick={() => setBatchMode('edit')} />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBatchMode('none')}
                    aria-label="Cancel batch mode"
                    className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && executeBatch()}
                      placeholder={
                        batchMode === 'tag' ? 'Enter tag to apply...' : 'Describe transformation...'
                      }
                      className="w-full glass-input px-3 py-2 text-xs font-mono text-white placeholder-slate-500 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500/50"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={executeBatch}
                    disabled={!inputValue.trim()}
                    aria-label="Execute batch action"
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:shadow-none transition-all"
                  >
                    <Check size={16} />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN TOOLBAR */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="glass-panel p-2 flex items-center gap-2 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)]"
        >
          <div className="flex items-center gap-3 px-4 border-r border-white/5 mr-1 py-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              {selectedIds.length}
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-white uppercase tracking-widest hidden md:block leading-none mb-0.5">
                Selected
              </span>
              <span className="text-[8px] font-mono text-slate-500 hidden md:block leading-none">
                ASSETS
              </span>
            </div>
          </div>

          <ActionButton
            icon={Layers}
            label="Batch Ops"
            onClick={() => setShowBatchMenu(!showBatchMenu)}
            active={showBatchMenu}
            color="text-cyan-400"
          />

          <div className="w-px h-6 bg-white/5 mx-1" />

          <ActionButton
            icon={Plus}
            label="Add to Reel"
            onClick={handleAddToReel}
            color="text-indigo-400"
          />

          <ActionButton
            icon={Film}
            label="Instant highlight"
            onClick={handleInstantHighlight}
            color="text-emerald-400"
            primary
          />

          <div className="w-px h-6 bg-white/5 mx-1" />

          <ActionButton
            icon={Trash2}
            label=""
            onClick={handleDelete}
            color="text-rose-500"
            hoverClass="hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400"
          />

          <button
            onClick={handleClear}
            aria-label="Clear selection"
            className="p-2.5 text-slate-500 hover:text-white transition-colors hover:rotate-90 duration-300"
          >
            <X size={18} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color: string;
  primary?: boolean;
  active?: boolean;
  hoverClass?: string;
}

const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  color,
  primary = false,
  active = false,
  hoverClass,
}: ActionButtonProps) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`
            flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden
            ${
              primary
                ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:bg-emerald-500 hover:text-white hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                : active
                  ? 'bg-white/10 border border-white/20 text-white shadow-inner'
                  : `glass-button ${hoverClass || 'hover:bg-white/10'} ${color}`
            }
        `}
    title={label}
  >
    <Icon size={16} className={primary ? 'animate-pulse group-hover:animate-none' : ''} />
    {label && (
      <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
        {label}
      </span>
    )}
  </motion.button>
);

interface BatchActionBtnProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

const BatchActionBtn = ({ icon: Icon, label, onClick }: BatchActionBtnProps) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group"
  >
    <div className="p-2.5 bg-black/40 rounded-lg group-hover:bg-indigo-600 group-hover:text-white text-slate-400 transition-all shadow-inner group-hover:shadow-lg group-hover:shadow-indigo-500/30">
      <Icon size={18} />
    </div>
    <span className="text-[9px] font-mono text-slate-500 group-hover:text-white uppercase tracking-tighter">
      {label}
    </span>
  </button>
);

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  Activity,
  Film,
  PlusCircle,
  LayoutGrid,
  Ratio,
  RotateCcw,
  RotateCw,
  Cuboid,
  X,
  Tags,
  Loader2,
  Layers,
  BrainCircuit,
} from 'lucide-react';
import { motion } from 'framer-motion';

const TagChip: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <span
    className={`text-[9px] px-2 py-1 rounded-full uppercase tracking-wider font-bold border border-white/5 shadow-sm backdrop-blur-sm ${color}`}
  >
    {label}
  </span>
);

export const InspectorPanel: React.FC = () => {
  const {
    images,
    selectedIds,
    setSelectedIds,
    updateImage,
    neuralTemperature,
    reanalyzeImage,
    addToReel,
    generateDepthMap,
  } = useStore();
  const activeImage = images.find(img => selectedIds.includes(img.id));
  const [newTag, setNewTag] = useState('');
  const [isHoveringPreview, setIsHoveringPreview] = useState(false);

  if (!activeImage)
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-40">
        <Activity size={32} className="mb-4 text-indigo-400" />
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-indigo-300">
          Awaiting Selection
        </div>
      </div>
    );

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    updateImage(activeImage.id, { tags: [...activeImage.tags, newTag.trim().toLowerCase()] });
    setNewTag('');
  };

  const hasComposition = !!activeImage.composition;

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto custom-scrollbar">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-bold text-white tracking-widest font-mono uppercase text-glow-primary">
            Inspector
          </h2>
          <div className="text-[9px] text-slate-500 font-mono">
            ID: {activeImage.id.slice(0, 8)}
          </div>
        </div>
        <button
          onClick={() => setSelectedIds([])}
          className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
          title="Close Inspector"
        >
          <X size={14} />
        </button>
      </div>

      {/* PREVIEW CONTAINER */}
      <div
        className="glass-panel rounded-2xl overflow-hidden aspect-video relative group ring-1 ring-white/10"
        onMouseEnter={() => setIsHoveringPreview(true)}
        onMouseLeave={() => setIsHoveringPreview(false)}
      >
        <div className="absolute inset-0 overflow-hidden">
          {/* Inline style required: dynamic CSS transform rotation not available in Tailwind */}
          <img
            src={activeImage.url}
            alt=""
            className="w-full h-full object-cover opacity-50 blur-2xl scale-150"
            style={{ transform: `rotate(${activeImage.rotation || 0}deg)` }}
          />
        </div>
        {/* Inline style required: dynamic CSS transform rotation not available in Tailwind */}
        <img
          src={activeImage.url}
          alt={activeImage.caption || 'Selected image preview'}
          title={activeImage.caption || 'Selected image preview'}
          className="absolute inset-0 w-full h-full object-contain z-10 transition-transform duration-500"
          style={{
            transform: `rotate(${activeImage.rotation || 0}deg) scale(${isHoveringPreview ? 1.05 : 1})`,
          }}
        />

        {/* Overlay Action Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={e => {
            e.stopPropagation();
            addToReel([activeImage.id]);
          }}
          className="absolute top-3 right-3 z-30 bg-emerald-500/90 backdrop-blur text-white p-2 rounded-full shadow-lg border border-emerald-400/50 hover:bg-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
          title="Quick Add to Reel"
        >
          <PlusCircle size={16} />
        </motion.button>

        {/* Viewing Original (Status Badge) */}
        {(activeImage.parentId || activeImage.isOriginal === false) && (
          <div className="absolute bottom-3 left-3 z-30 flex items-center gap-2 p-1.5 bg-black/60 backdrop-blur rounded-lg border border-amber-500/20">
            <Film size={12} className="text-amber-400" />
            <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wide">
              {activeImage.isOriginal ? 'Original' : `v${activeImage.versionNumber || 2}`}
            </span>
            {activeImage.parentId && (
              <button
                onClick={() => {
                  // Logic to switch would go here, simplified for UI polish
                }}
                className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-amber-500/20 hover:bg-white/10 text-amber-300 rounded transition-colors"
              >
                View Orig
              </button>
            )}
          </div>
        )}
      </div>

      {/* METADATA GRID */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-panel p-3 rounded-xl flex flex-col gap-1">
          <div className="flex items-center gap-2 text-indigo-300 mb-1">
            <LayoutGrid size={12} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Dimensions</span>
          </div>
          <span className="text-xl font-mono font-light text-white">
            {activeImage.width}
            <span className="text-slate-500 mx-1">x</span>
            {activeImage.height}
          </span>
        </div>

        <div className="glass-panel p-3 rounded-xl flex flex-col gap-1">
          <div className="flex items-center gap-2 text-rose-300 mb-1">
            <Ratio size={12} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Aspect</span>
          </div>
          <span className="text-xl font-mono font-light text-white">
            {(activeImage.width / activeImage.height).toFixed(2)}
          </span>
        </div>
      </div>

      {/* TRANSFORMS */}
      <div className="glass-panel p-4 rounded-xl flex flex-col gap-3">
        <div className="flex items-center gap-2 text-slate-400 mb-1">
          <Cuboid size={12} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Spatial Transforms</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              updateImage(activeImage.id, { rotation: (activeImage.rotation || 0) - 90 })
            }
            className="flex-1 py-2 glass-button rounded-lg flex items-center justify-center text-slate-300 hover:text-white"
            title="Rotate Counter-Clockwise"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={() =>
              updateImage(activeImage.id, { rotation: (activeImage.rotation || 0) + 90 })
            }
            className="flex-1 py-2 glass-button rounded-lg flex items-center justify-center text-slate-300 hover:text-white"
            title="Rotate Clockwise"
          >
            <RotateCw size={14} />
          </button>
        </div>
      </div>

      {/* AI ANALYSIS SECTION */}
      <div className="glass-panel p-4 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-10">
          <BrainCircuit size={80} />
        </div>
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2 text-purple-300">
            <BrainCircuit size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-glow-accent">
              Neural Analysis
            </span>
          </div>
          <button
            onClick={() => reanalyzeImage(activeImage.id)}
            disabled={neuralTemperature > 0 || activeImage.analyzed}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-purple-300 disabled:opacity-30"
            title="Re-analyze Image"
          >
            <RotateCw size={12} className={neuralTemperature > 0 ? 'animate-spin' : ''} />
          </button>
        </div>

        {activeImage.analyzed ? (
          <div className="flex flex-col gap-4 relative z-10">
            {activeImage.caption && (
              <p className="text-xs text-slate-300 leading-relaxed font-light border-l-2 border-purple-500/30 pl-3">
                {activeImage.caption}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {activeImage.tags.map(tag => (
                <TagChip
                  key={tag}
                  label={tag}
                  color="bg-purple-900/30 text-purple-200 border-purple-500/20"
                />
              ))}
              <div className="flex items-center gap-1 bg-black/40 rounded-full pl-2 pr-1 py-0.5 border border-white/5">
                <Tags size={10} className="text-slate-500" />
                <input
                  type="text"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                  placeholder="Add tag..."
                  className="bg-transparent border-none outline-none text-[9px] text-white w-16 placeholder:text-slate-600 font-mono"
                />
                <button
                  onClick={handleAddTag}
                  className="p-0.5 hover:text-white text-slate-500 transition-colors"
                  title="Add Tag"
                >
                  <PlusCircle size={10} />
                </button>
              </div>
            </div>

            {/* Composition Stats (using available properties) */}
            {hasComposition && (
              <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-white/5">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-slate-500 uppercase">Aesthetics</span>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500"
                      style={{ width: `${(activeImage.composition?.aestheticScore || 0) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-slate-500 uppercase">Energy</span>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500"
                      style={{ width: `${(activeImage.composition?.semanticEnergy || 0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500 italic text-xs">
            <Loader2 size={12} className="animate-spin" />
            <span>Analyzing visual features...</span>
          </div>
        )}
      </div>

      {/* DEPTH MAP BUTTON */}
      <button
        onClick={() => generateDepthMap(activeImage.id)}
        disabled={neuralTemperature > 0}
        className="w-full py-3 glass-button rounded-xl flex items-center justify-center gap-2 group disabled:opacity-50"
      >
        <Layers size={14} className="text-cyan-400 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-100">
          Generate Depth Map
        </span>
      </button>
    </div>
  );
};

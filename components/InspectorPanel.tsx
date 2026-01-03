import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  Zap,
  BrainCircuit,
  Grid3x3,
  Activity,
  Gauge,
  Film,
  Wand2,
  PlusCircle,
  LayoutGrid,
  Focus,
  Ratio,
  RotateCcw,
  RotateCw,
  Cuboid,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TagChip: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase tracking-tight font-bold ${color}`}>
    {label}
  </span>
);

export const InspectorPanel: React.FC = () => {
  const {
    images,
    selectedIds,
    setSelectedIds,
    updateImage,
    removeImage,
    performUpscale,
    neuralTemperature,
    reanalyzeImage,
    addToReel,
    autoStyleImage,
    resetFilters,
    applyCompositionRule,
    generateDepthMap,
  } = useStore();
  const activeImage = images.find(img => selectedIds.includes(img.id));
  const [_newTag, _setNewTag] = useState('');
  const [isHoveringPreview, setIsHoveringPreview] = useState(false);

  if (!activeImage)
    return (
      <div className="p-8 text-center text-slate-600 font-mono text-[10px] uppercase">
        No Selection Detected
      </div>
    );

  const _handleAddTag = () => {
    if (!_newTag.trim()) return;
    updateImage(activeImage.id, { tags: [...activeImage.tags, _newTag.trim().toLowerCase()] });
    _setNewTag('');
  };

  const hasComposition = !!activeImage.composition;

  return (
    <div className="flex flex-col gap-6 p-5">
      {/* PREVIEW CONTAINER */}
      <div
        className="bg-black/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl aspect-video relative group"
        onMouseEnter={() => setIsHoveringPreview(true)}
        onMouseLeave={() => setIsHoveringPreview(false)}
      >
        <div className="absolute inset-0 overflow-hidden">
          {/* Inline style required: dynamic CSS transform rotation not available in Tailwind */}
          <img
            src={activeImage.url}
            alt=""
            title="Background blur effect"
            className="w-full h-full object-cover opacity-30 blur-xl scale-125"
            style={{ transform: `rotate(${activeImage.rotation || 0}deg)` }}
          />
        </div>
        {/* Inline style required: dynamic CSS transform rotation not available in Tailwind */}
        <img
          src={activeImage.url}
          alt={activeImage.caption || 'Selected image preview'}
          title={activeImage.caption || 'Selected image preview'}
          className="absolute inset-0 w-full h-full object-contain z-10"
          style={{ transform: `rotate(${activeImage.rotation || 0}deg)` }}
        />

        {/* Overlay Action Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={e => {
            e.stopPropagation();
            addToReel([activeImage.id]);
          }}
          className="absolute top-3 right-3 z-30 bg-emerald-500 text-white p-2 rounded-full shadow-lg border border-emerald-400/50 hover:bg-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
          title="Quick Add to Reel"
        >
          <PlusCircle size={16} />
        </motion.button>

        {/* COMPOSITION OVERLAYS */}
        <AnimatePresence>
          {isHoveringPreview && hasComposition && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 pointer-events-none"
            >
              {/* Rule of Thirds Grid */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-white/20" />
                ))}
              </div>

              {/* Tension Points */}
              {activeImage.composition?.tensionPoints?.map((tp, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute w-4 h-4 -ml-2 -mt-2 flex items-center justify-center"
                  style={{ left: `${tp.x * 100}%`, top: `${tp.y * 100}%` }}
                >
                  <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-50" />
                  <div className="w-1.5 h-1.5 bg-rose-400 rounded-full shadow-[0_0_10px_rgba(244,63,94,1)] relative z-10" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {hasComposition && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 text-[8px] font-black text-white/50 z-30 uppercase tracking-widest">
            Hover for Analysis
          </div>
        )}
      </div>

      {/* === VERSION CONTROLS (NEW) === */}
      {(activeImage.parentId || activeImage.isOriginal === false) && (
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20">
          <div className="flex items-center gap-2">
            <Film size={14} className="text-amber-400" />
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wide">
              {activeImage.isOriginal ? 'Original' : `Version ${activeImage.versionNumber || 2}`}
            </span>
            {activeImage.processingStatus === 'processing' && (
              <span className="text-[9px] text-amber-400 animate-pulse">Processing...</span>
            )}
          </div>
          {activeImage.parentId && (
            <button
              onClick={() => {
                // Find and select the original asset
                const original = images.find(img => img.id === activeImage.parentId);
                if (original) {
                  setSelectedIds([original.id]);
                }
              }}
              className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded border border-amber-500/30 transition-colors"
              title="View the original unedited image"
            >
              View Original
            </button>
          )}
        </div>
      )}

      {/* Show versions list if this is an original with child versions */}
      {activeImage.isOriginal !== false &&
        (() => {
          const versions = images.filter(img => img.parentId === activeImage.id);
          if (versions.length === 0) return null;
          return (
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Cuboid size={12} className="text-cyan-400" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  {versions.length} Version{versions.length !== 1 ? 's' : ''} Available
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {versions.slice(0, 5).map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedIds([v.id])}
                    className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white/20 hover:border-cyan-400 transition-colors"
                    title={`Version ${v.versionNumber || i + 2}`}
                  >
                    <img
                      src={v.url}
                      alt={`Version ${i + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

      {/* NEURAL DNA */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-white/5">
          <BrainCircuit size={12} className="text-emerald-400" />
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
            Neural DNA
          </span>
        </div>

        {/* Transform Controls */}
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 mt-2">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <RotateCw size={12} /> Transform
          </span>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="-180"
              max="180"
              value={activeImage.rotation || 0}
              onChange={e => updateImage(activeImage.id, { rotation: parseInt(e.target.value) })}
              className="w-24 h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
              aria-label="Rotation angle"
              title="Adjust rotation (-180° to 180°)"
            />
            <button
              onClick={() =>
                updateImage(activeImage.id, { rotation: (activeImage.rotation || 0) + 90 })
              }
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-slate-300 transition-colors"
              title="Rotate +90°"
            >
              <RotateCw size={12} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {activeImage.localTags?.map(t => (
            <TagChip key={`local-${t}`} label={`⚡${t}`} color="bg-amber-500/20 text-amber-300" />
          ))}
          {activeImage.tags.length > 0 && (
            <TagChip
              label="✨ GEMINI"
              color="bg-indigo-600 text-white border border-indigo-400/50 shadow-[0_0_10px_rgba(99,102,241,0.4)]"
            />
          )}
          {activeImage.tags.map(t => (
            <TagChip key={t} label={t} color="bg-indigo-500/20 text-indigo-300" />
          ))}
        </div>
      </div>

      {/* COMPOSITIONAL INTELLIGENCE */}
      {hasComposition && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-white/5">
            <Grid3x3 size={12} className="text-fuchsia-400" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Composition AI
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 p-2 rounded-lg border border-white/5">
              <div className="flex items-center gap-2 mb-1 opacity-60">
                <Gauge size={10} />
                <span className="text-[8px] uppercase font-bold">Balance</span>
              </div>
              <div className="text-lg font-mono text-fuchsia-300 font-bold">
                {(activeImage.composition?.aestheticScore || 0) * 10}/10
              </div>
            </div>
            <div className="bg-white/5 p-2 rounded-lg border border-white/5">
              <div className="flex items-center gap-2 mb-1 opacity-60">
                <Activity size={10} />
                <span className="text-[8px] uppercase font-bold">Entropy</span>
              </div>
              <div className="text-lg font-mono text-cyan-300 font-bold">
                {Math.round((activeImage.composition?.semanticEnergy || 0) * 100)}%
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border border-dashed border-white/10 p-2 rounded">
              <span className="uppercase">Detected Rule:</span>
              <span className="text-white font-bold uppercase tracking-wider">
                {activeImage.composition?.dominant_rule || 'Unstructured'}
              </span>
            </div>

            {activeImage.composition?.improvementAdvisory && (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={10} className="text-indigo-400" />
                  <span className="text-[8px] font-black uppercase text-indigo-300 tracking-widest">
                    AI Advisory
                  </span>
                </div>
                <p className="text-[9px] text-indigo-100/80 font-mono leading-relaxed">
                  {activeImage.composition.improvementAdvisory}
                </p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 mt-2">
              <button
                onClick={() => applyCompositionRule(activeImage.id, 'thirds')}
                className="flex flex-col items-center justify-center gap-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[8px] font-black uppercase text-slate-300 hover:text-white transition-colors"
              >
                <LayoutGrid size={14} /> Thirds
              </button>
              <button
                onClick={() => applyCompositionRule(activeImage.id, 'center')}
                className="flex flex-col items-center justify-center gap-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[8px] font-black uppercase text-slate-300 hover:text-white transition-colors"
              >
                <Focus size={14} /> Center
              </button>
              <button
                onClick={() => applyCompositionRule(activeImage.id, 'golden')}
                className="flex flex-col items-center justify-center gap-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[8px] font-black uppercase text-slate-300 hover:text-white transition-colors"
              >
                <Ratio size={14} /> Golden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEURAL FORGE */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b border-white/5">
          <Zap size={12} className="text-indigo-400" />
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
            Neural Forge
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => performUpscale(activeImage.id)}
            className="py-2 bg-indigo-600 rounded-lg text-[9px] font-black uppercase text-white hover:bg-indigo-500"
          >
            Upscale 4K
          </button>
          <button
            onClick={() => reanalyzeImage(activeImage.id)}
            className="py-2 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase text-slate-300 hover:text-white"
          >
            Deep Analyze
          </button>
          <button
            onClick={() => autoStyleImage(activeImage.id)}
            className="col-span-1 py-3 bg-gradient-to-r from-fuchsia-600/20 to-purple-600/20 border border-fuchsia-500/30 rounded-lg text-[9px] font-black uppercase text-fuchsia-300 hover:text-white hover:bg-fuchsia-600/30 flex items-center justify-center gap-2"
          >
            <Wand2 size={12} /> Auto-Filter
          </button>
          <button
            onClick={() => resetFilters(activeImage.id)}
            className="col-span-1 py-3 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase text-slate-300 hover:text-white flex items-center justify-center gap-2"
          >
            <RotateCcw size={12} /> Reset Filters
          </button>
          <button
            onClick={() => generateDepthMap(activeImage.id)}
            disabled={!!activeImage.depthMapUrl || neuralTemperature > 50}
            className="col-span-2 py-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg text-[9px] font-black uppercase text-purple-300 hover:text-white hover:bg-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              activeImage.depthMapUrl
                ? 'Depth map already generated'
                : 'Generate 3D depth map (~50MB model download on first use)'
            }
          >
            <Cuboid size={12} />
            {activeImage.depthMapUrl
              ? '✓ Depth Map'
              : neuralTemperature > 50
                ? 'Processing...'
                : 'Gen Depth Map'}
          </button>
        </div>
      </div>

      <button
        onClick={() => addToReel([activeImage.id])}
        className="w-full py-3 bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 border border-cyan-500/30 text-cyan-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 hover:bg-cyan-600/30"
      >
        <Film size={14} /> Add to Reel
      </button>

      <button
        onClick={() => removeImage(activeImage.id)}
        className="mt-2 py-3 bg-rose-500/5 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
      >
        Delete Asset
      </button>
    </div>
  );
};

interface SparklesProps {
  size?: number;
  className?: string;
}

const Sparkles: React.FC<SparklesProps> = ({ size = 24, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M9 5H5" />
    <path d="M19 21v-4" />
    <path d="M15 19h4" />
  </svg>
);

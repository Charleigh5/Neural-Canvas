import React, { useState, useEffect, useRef } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Clock, Settings, X, Maximize2, Crop, Eraser, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useImage } from '../../hooks/useImage';
import { ImageAsset } from '../../types';

const ITEM_WIDTH = 192;

// Internal component to handle IDB url resolution and ImageBitmap rendering
const SequencerImage = ({ url, isCurrent }: { url: string; isCurrent: boolean }) => {
  const [img, status] = useImage(url);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (status === 'loaded' && img instanceof ImageBitmap && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = img.width;
        canvasRef.current.height = img.height;
        ctx.drawImage(img, 0, 0);
      }
    }
  }, [img, status]);

  if (status === 'loading') return <div className="w-full h-full bg-slate-800 animate-pulse" />;
  if (status === 'failed' || !img)
    return (
      <div className="w-full h-full bg-rose-900/20 flex items-center justify-center text-rose-500 text-xs font-mono">
        ERROR
      </div>
    );

  if (img instanceof ImageBitmap) {
    return (
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity pl-6 ${isCurrent ? '' : 'grayscale-[20%]'}`}
        aria-label="Sequencer image thumbnail"
      />
    );
  }

  return (
    <img
      src={(img as HTMLImageElement).src}
      alt="Sequencer frame thumbnail"
      className={`w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity pl-6 ${isCurrent ? '' : 'grayscale-[20%]'}`}
      loading="lazy"
    />
  );
};

interface MenuButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color?: string;
  hoverColor?: string;
}

const MenuButton = ({
  icon: Icon,
  label,
  onClick,
  color = 'text-slate-300',
  hoverColor = 'hover:bg-indigo-500/20',
}: MenuButtonProps) => (
  <button
    onClick={e => {
      e.stopPropagation();
      onClick();
    }}
    className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left transition-colors ${hoverColor} group`}
    aria-label={label}
  >
    <Icon size={12} className={`${color} group-hover:scale-110 transition-transform`} />
    <span
      className={`text-[9px] font-bold uppercase tracking-wider ${color} group-hover:text-white`}
    >
      {label}
    </span>
  </button>
);

export const SequencerItem = React.memo(
  ({
    id,
    idx,
    img,
    isCurrent,
    isVisible,
    onRemove,
    onMenuAction,
    onDurationChange,
  }: {
    id: string;
    idx: number;
    img: ImageAsset;
    isCurrent: boolean;
    isVisible: boolean;
    onRemove: (id: string) => void;
    onMenuAction: (id: string, action: string) => void;
    onDurationChange: (id: string, duration: number) => void;
  }) => {
    const dragControls = useDragControls();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const duration = img.duration || 5;

    return (
      <Reorder.Item
        value={id}
        className="relative group shrink-0 h-full flex flex-col justify-end pb-2 z-10"
        dragListener={false}
        dragControls={dragControls}
        whileDrag={{ scale: 1.05, zIndex: 100, cursor: 'grabbing' }}
        style={{ width: ITEM_WIDTH }}
      >
        <div
          className={`relative w-48 h-32 rounded-xl overflow-hidden border-2 transition-all ${isVisible ? (isCurrent ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'bg-slate-900 border-white/10 group-hover:border-white/30') : 'bg-white/5 border-white/5'}`}
        >
          {isVisible ? (
            <>
              {/* Drag Handle */}
              <div
                className="absolute left-0 top-0 bottom-0 w-6 bg-black/60 border-r border-white/5 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors z-20 group/grip backdrop-blur-sm"
                onPointerDown={e => dragControls.start(e)}
              >
                <GripVertical size={12} className="text-slate-500 group-hover/grip:text-white" />
              </div>

              {/* Resolved Image */}
              <SequencerImage url={img.url} isCurrent={isCurrent} />

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />

              {/* Transition Badge */}
              {img.transition && (
                <div className="absolute top-2 left-8 bg-black/40 rounded px-1.5 py-0.5 border border-white/10 backdrop-blur-md">
                  <span className="text-[8px] font-black uppercase text-indigo-300 tracking-widest">
                    {img.transition}
                  </span>
                </div>
              )}

              {/* Duration Badge / Control */}
              <div className="absolute top-2 right-2 flex items-center bg-black/60 rounded-md border border-white/10 backdrop-blur-md px-1.5 py-0.5 z-30">
                <Clock size={10} className="text-slate-400 mr-1" />
                <input
                  aria-label="Duration in seconds"
                  title="Duration in seconds"
                  type="number"
                  min="1"
                  max="60"
                  value={duration}
                  onChange={e => onDurationChange(id, parseInt(e.target.value) || 5)}
                  className="w-6 bg-transparent text-[9px] font-mono text-white text-center focus:outline-none"
                />
                <span className="text-[9px] text-slate-500 font-mono">s</span>
              </div>

              {/* Info & Menu */}
              <div className="absolute bottom-2 left-8 right-2 flex justify-between items-end">
                <div className="flex flex-col overflow-hidden">
                  <span
                    className={`text-[9px] font-black uppercase leading-none mb-1 ${isCurrent ? 'text-indigo-300' : 'text-slate-500'}`}
                  >
                    SLIDE_{idx + 1}
                  </span>
                  <span className="text-[8px] font-mono text-slate-400 truncate tracking-tight">
                    {img.tags[0] || 'ANALYZING...'}
                  </span>
                </div>

                <button
                  onClick={e => {
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                  className={`p-1.5 rounded-lg transition-all z-30 ${isMenuOpen ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-400 hover:text-white hover:bg-white/20'}`}
                  aria-label="Open item settings menu"
                  title="Settings"
                >
                  <Settings size={12} />
                </button>
              </div>

              <button
                onClick={e => {
                  e.stopPropagation();
                  onRemove(id);
                }}
                className="absolute top-2 left-8 p-1 text-slate-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity z-30"
                aria-label="Remove this slide"
                title="Remove slide"
              >
                <X size={12} />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-700/50">
              {/* Fallback Icon */}
            </div>
          )}
        </div>

        {/* Neural Menu Popup */}
        <AnimatePresence>
          {isMenuOpen && isVisible && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full mb-2 left-0 w-48 bg-[#0a0a0a] border border-indigo-500/30 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.8)] p-1.5 z-50 flex flex-col gap-1 backdrop-blur-xl"
              >
                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-2 py-1 border-b border-white/5 mb-1 flex items-center gap-2">
                  <Sparkles size={10} className="text-indigo-500" /> Neural Ops
                </div>
                <MenuButton
                  icon={Maximize2}
                  label="Upscale 4K"
                  onClick={() => {
                    onMenuAction(id, 'upscale');
                    setIsMenuOpen(false);
                  }}
                />
                <MenuButton
                  icon={Crop}
                  label="Smart Crop"
                  onClick={() => {
                    onMenuAction(id, 'crop');
                    setIsMenuOpen(false);
                  }}
                />
                <div className="h-px bg-white/5 my-1" />
                <MenuButton
                  icon={Eraser}
                  label="Remove BG"
                  onClick={() => {
                    onMenuAction(id, 'remove_bg');
                    setIsMenuOpen(false);
                  }}
                  color="text-rose-400"
                  hoverColor="hover:bg-rose-900/30"
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </Reorder.Item>
    );
  }
);

SequencerItem.displayName = 'SequencerItem';

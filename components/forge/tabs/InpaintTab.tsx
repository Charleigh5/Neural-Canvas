import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brush, Undo2, Target, Eraser, PlusCircle, LucideIcon } from 'lucide-react';
import { ImageAsset, Point } from '../../../types';

interface InpaintTabProps {
  image: ImageAsset;
  tool: 'brush' | 'pointer';
  setTool: (tool: 'brush' | 'pointer') => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  maskOpacity: number;
  setMaskOpacity: (opacity: number) => void;
  clearMask: () => void;

  thumbRef: React.RefObject<HTMLDivElement | null>;
  handleThumbnailClick: (e: React.MouseEvent) => void;
  startDrawing: (e: React.MouseEvent) => void;
  stopDrawing: () => void;
  draw: (e: React.MouseEvent) => void;

  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  maskCanvasRef: React.RefObject<HTMLCanvasElement | null>;

  mousePos: Point;
  anchor: Point | null;
  hasMaskData: boolean;

  prompt: string;
  command: string;
  handleApplyEdit: (prompt?: string, mode?: 'inpaint' | 'remix') => void;
}

export const InpaintTab: React.FC<InpaintTabProps> = ({
  image,
  tool,
  setTool,
  brushSize,
  setBrushSize,
  maskOpacity,
  setMaskOpacity,
  clearMask,
  thumbRef,
  handleThumbnailClick,
  startDrawing,
  stopDrawing,
  draw,
  canvasRef,
  maskCanvasRef,
  mousePos,
  anchor,
  hasMaskData,
  prompt,
  command,
  handleApplyEdit,
}) => {
  return (
    <motion.div
      key="inpaint"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-black uppercase text-indigo-400 tracking-[0.2em]">
          Mask Controls
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
          <ToolBtn active={tool === 'brush'} onClick={() => setTool('brush')} icon={Brush} />
          <ToolBtn active={tool === 'pointer'} onClick={() => setTool('pointer')} icon={Target} />
        </div>

        <div className="flex items-center gap-4 bg-black/20 px-3 py-1 rounded-full border border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">
              Size
            </span>
            <input
              type="range"
              min="5"
              max="100"
              value={brushSize}
              onChange={e => setBrushSize(parseInt(e.target.value))}
              className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              aria-label="Brush Size"
            />
          </div>
          <div className="flex items-center gap-2 border-l border-white/10 pl-2">
            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">
              Viz
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={maskOpacity}
              onChange={e => setMaskOpacity(parseFloat(e.target.value))}
              className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              aria-label="Mask Visibility"
            />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={clearMask}
          className="text-[8px] text-rose-500 hover:text-rose-400 uppercase font-black tracking-tighter flex items-center gap-1"
        >
          <Undo2 size={10} /> Reset_Mask
        </motion.button>
      </div>

      <motion.div
        ref={thumbRef}
        onClick={handleThumbnailClick}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={
          {
            aspectRatio: `${image.width} / ${image.height}`,
            '--mask-opacity': maskOpacity,
            '--brush-size': `${brushSize}px`,
            '--mouse-x': `${mousePos.x}px`,
            '--mouse-y': `${mousePos.y}px`,
            '--anchor-x': anchor ? `${anchor.x}%` : '0%',
            '--anchor-y': anchor ? `${anchor.y}%` : '0%',
          } as React.CSSProperties
        }
        className={`relative w-full max-h-[300px] bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-inner group transition-all duration-300 ${tool === 'brush' ? 'cursor-none' : 'cursor-crosshair'}`}
      >
        <img
          src={image.url}
          className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity pointer-events-none"
          alt="Source image for inpainting"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none transition-opacity opacity-[var(--mask-opacity)]"
        />
        <canvas ref={maskCanvasRef} className="hidden" />

        {tool === 'brush' && (
          <div className="absolute border border-white/80 rounded-full pointer-events-none z-50 bg-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.4)] w-[var(--brush-size)] h-[var(--brush-size)] left-[var(--mouse-x)] top-[var(--mouse-y)] -translate-x-1/2 -translate-y-1/2" />
        )}

        <AnimatePresence>
          {anchor && tool === 'pointer' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center left-[var(--anchor-x)] top-[var(--anchor-y)]"
            >
              <div className="absolute inset-0 bg-indigo-500 rounded-full blur-md opacity-40 animate-pulse" />
              <Target
                size={24}
                className="text-indigo-400 relative z-10 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="grid grid-cols-2 gap-2">
        <InpaintActionBtn
          icon={Eraser}
          label="Magic Eraser"
          onClick={() =>
            handleApplyEdit(
              'Cleanly remove the objects within the marked area, blending the textures and lighting with the background.',
              'inpaint'
            )
          }
          color="rose"
          disabled={!hasMaskData && !anchor}
        />
        <InpaintActionBtn
          icon={PlusCircle}
          label="Generative Fill"
          onClick={() =>
            handleApplyEdit(
              `Integrate the following specifically into the marked region: ${prompt || command}. Match lighting and perspective perfectly.`,
              'inpaint'
            )
          }
          color="cyan"
          disabled={(!prompt.trim() && !command.trim()) || (!hasMaskData && !anchor)}
        />
      </div>
    </motion.div>
  );
};

interface ToolBtnProps {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
}

const ToolBtn = ({ active, onClick, icon: Icon }: ToolBtnProps) => (
  <motion.button
    whileHover={{
      scale: 1.1,
      backgroundColor: active ? 'rgba(79, 70, 229, 1)' : 'rgba(255,255,255,0.1)',
    }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className={`p-2 rounded-md transition-all ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
  >
    <Icon size={14} />
  </motion.button>
);

interface InpaintActionBtnProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  color: 'rose' | 'cyan';
  disabled: boolean;
}

const InpaintActionBtn = ({
  icon: Icon,
  label,
  onClick,
  color,
  disabled,
}: InpaintActionBtnProps) => (
  <motion.button
    whileHover={{
      backgroundColor: `rgba(${color === 'rose' ? '244, 63, 94' : '6, 182, 212'}, 0.15)`,
      scale: 1.02,
    }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    disabled={disabled}
    className={`p-3 bg-${color}-500/10 border border-${color}-500/20 rounded-xl transition-all flex items-center justify-center gap-3 group disabled:opacity-30 shadow-md`}
  >
    <Icon size={14} className={`text-${color}-400 group-hover:scale-110 transition-transform`} />
    <span className={`text-[9px] font-black uppercase text-${color}-300 tracking-widest`}>
      {label}
    </span>
  </motion.button>
);

import React, { useRef, useEffect, useState } from 'react';
import { Eraser, Paintbrush, Check, X } from 'lucide-react';
import { ImageAsset } from '../../types';

interface InpaintTabProps {
  image: ImageAsset;
  prompt: string;
  setPrompt: (prompt: string) => void;
  isProcessing: boolean;
  onApplyInpaint: (mask: string) => void;
}

export const InpaintTab: React.FC<InpaintTabProps> = ({
  image,
  prompt,
  setPrompt,
  isProcessing,
  onApplyInpaint,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(30);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvases
  useEffect(() => {
    const canvas = canvasRef.current;
    const imgCanvas = imageCanvasRef.current;
    if (!canvas || !imgCanvas) return;

    const ctx = canvas.getContext('2d');
    const imgCtx = imgCanvas.getContext('2d');
    if (!ctx || !imgCtx) return;

    // Set canvas size
    canvas.width = 300;
    canvas.height = 200;
    imgCanvas.width = 300;
    imgCanvas.height = 200;

    // Clear mask canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [image.id]);

  const startDrawing = (e: React.MouseEvent) => {
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      lastPoint.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const rect = canvas?.getBoundingClientRect();
    if (!ctx || !rect || !canvas) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = tool === 'brush' ? 'white' : 'black';

    if (lastPoint.current) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    lastPoint.current = { x, y };
  };

  const clearMask = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const maskData = canvas.toDataURL('image/png');
    onApplyInpaint(maskData);
  };

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-gray-400 uppercase tracking-widest">Paint the area to edit</p>

      {/* Canvas Area */}
      <div className="relative rounded-lg overflow-hidden border border-white/10">
        <canvas ref={imageCanvasRef} className="absolute inset-0 w-full h-[200px] object-cover" />
        <canvas
          ref={canvasRef}
          className="relative w-full h-[200px] cursor-crosshair mix-blend-screen opacity-60"
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onMouseMove={draw}
        />
      </div>

      {/* Tools */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTool('brush')}
          className={`p-2 rounded-lg transition-all ${
            tool === 'brush'
              ? 'bg-cyan-500/30 text-cyan-300'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
          title="Brush"
        >
          <Paintbrush size={16} />
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={`p-2 rounded-lg transition-all ${
            tool === 'eraser'
              ? 'bg-cyan-500/30 text-cyan-300'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
          title="Eraser"
        >
          <Eraser size={16} />
        </button>

        <div className="flex-1 flex items-center gap-2 px-2">
          <span className="text-[9px] text-gray-500">Size</span>
          <input
            type="range"
            min="5"
            max="80"
            value={brushSize}
            onChange={e => setBrushSize(parseInt(e.target.value))}
            className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            aria-label="Brush size"
          />
        </div>

        <button
          onClick={clearMask}
          className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
          title="Clear mask"
        >
          <X size={16} />
        </button>
      </div>

      {/* Prompt */}
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="What should replace the masked area?"
        className="w-full h-16 bg-black/50 border border-white/10 rounded-lg p-2 text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none"
        disabled={isProcessing}
        aria-label="Inpaint prompt"
      />

      <button
        onClick={handleApply}
        disabled={!prompt.trim() || isProcessing}
        className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:from-gray-600 disabled:to-gray-600 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
      >
        <Check size={16} />
        {isProcessing ? 'Inpainting...' : 'Apply Inpaint'}
      </button>
    </div>
  );
};

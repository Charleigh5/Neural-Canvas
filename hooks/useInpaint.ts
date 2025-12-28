import { useState, useRef, useCallback } from 'react';
import { Point, ForgeTab } from '../types';

export const useInpaint = () => {
  const [tool, setTool] = useState<'brush' | 'pointer'>('brush');
  const [brushSize, setBrushSize] = useState(40);
  const [maskOpacity, setMaskOpacity] = useState(0.5);
  const [anchor, setAnchor] = useState<Point | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasMaskData, setHasMaskData] = useState(false);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });

  const thumbRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);

  const initMaskCanvases = useCallback(() => {
    if (!thumbRef.current || !canvasRef.current || !maskCanvasRef.current) return;
    const rect = thumbRef.current.getBoundingClientRect();

    canvasRef.current.width = rect.width;
    canvasRef.current.height = rect.height;

    maskCanvasRef.current.width = rect.width;
    maskCanvasRef.current.height = rect.height;

    const mCtx = maskCanvasRef.current.getContext('2d');
    if (mCtx) {
      mCtx.fillStyle = 'black';
      mCtx.fillRect(0, 0, rect.width, rect.height);
    }
  }, []);

  const draw = useCallback(
    (e: React.MouseEvent) => {
      const rect = thumbRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y });

      if (!isDrawing || !canvasRef.current || !maskCanvasRef.current) return;

      const ctx = canvasRef.current.getContext('2d');
      const mCtx = maskCanvasRef.current.getContext('2d');

      if (ctx && mCtx) {
        // Draw visual feedback (Red)
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)'; // Rose-500
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineTo(x, y);
        ctx.stroke();

        // Draw semantic mask (White on Black)
        mCtx.strokeStyle = 'white';
        mCtx.lineWidth = brushSize;
        mCtx.lineCap = 'round';
        mCtx.lineJoin = 'round';
        mCtx.lineTo(x, y);
        mCtx.stroke();

        setHasMaskData(true);
      }
    },
    [brushSize, isDrawing]
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent) => {
      if (tool !== 'brush' || !canvasRef.current || !maskCanvasRef.current) return;
      setIsDrawing(true);
      const rect = thumbRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ctx = canvasRef.current.getContext('2d');
      const mCtx = maskCanvasRef.current.getContext('2d');

      if (ctx && mCtx) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        mCtx.beginPath();
        mCtx.moveTo(x, y);
      }
      draw(e);
    },
    [tool, draw]
  );

  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      const ctx = canvasRef.current?.getContext('2d');
      const mCtx = maskCanvasRef.current?.getContext('2d');
      ctx?.closePath();
      mCtx?.closePath();
      setIsDrawing(false);
    }
  }, [isDrawing]);

  const clearMask = useCallback(() => {
    if (canvasRef.current && maskCanvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      const mCtx = maskCanvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      if (mCtx) {
        mCtx.fillStyle = 'black';
        mCtx.fillRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
      }
    }
    setAnchor(null);
    setHasMaskData(false);
  }, []);

  const handleThumbnailClick = useCallback(
    (e: React.MouseEvent, activeTab: ForgeTab, setActiveTab: (tab: ForgeTab) => void) => {
      if (tool === 'brush') return;
      if (!thumbRef.current) return;
      const rect = thumbRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setAnchor({ x, y });

      const allowedTabs = ['inpaint', 'upscale', 'atmosphere', 'camera', 'frame'];
      if (!allowedTabs.includes(activeTab)) {
        setActiveTab('inpaint');
      }
    },
    [tool]
  );

  return {
    tool,
    setTool,
    brushSize,
    setBrushSize,
    maskOpacity,
    setMaskOpacity,
    anchor,
    setAnchor,
    isDrawing,
    hasMaskData,
    setHasMaskData,
    mousePos,
    thumbRef,
    canvasRef,
    maskCanvasRef,
    initMaskCanvases,
    startDrawing,
    stopDrawing,
    draw,
    clearMask,
    handleThumbnailClick,
  };
};

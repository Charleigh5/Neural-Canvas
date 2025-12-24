import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Wand2,
  Palette,
  Zap,
  X,
  Check,
  Loader2,
  Eraser,
  Image as ImageIcon,
  Type,
  Camera,
  Snowflake,
  Gift,
  Star,
  RefreshCw,
  Languages,
  Lightbulb,
  PenTool,
  Target,
  Trash2,
  PlusCircle,
  Focus,
  MousePointer2,
  Brush,
  Undo2,
  Box,
  Send,
  Maximize2,
  CloudRain,
  SunDim,
  Wind,
  Upload,
  Layers,
  Crop,
  RotateCcw,
  BrainCircuit,
  Flame,
  Sun,
  Moon,
  CloudLightning,
  ImageMinus,
  Sliders,
  Stars,
  Image,
  Ghost,
  Zap as Lightning,
  Grid,
  Monitor,
  Layout,
  Film,
  Video,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  LayoutTemplate,
  Scan,
  Ratio,
  LayoutGrid,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { ImageAsset } from '../types';
import { refinePrompt } from '../services/geminiService';
import { assetDB } from '../services/db';

interface FloatingNanoForgeProps {
  image: ImageAsset;
  onClose: () => void;
  initialTab?:
    | 'forge'
    | 'style'
    | 'inpaint'
    | 'prop'
    | 'upscale'
    | 'atmosphere'
    | 'frame'
    | 'backdrop'
    | 'camera';
  anchorPosition?: { x: number; y: number };
}

export const FloatingNanoForge: React.FC<FloatingNanoForgeProps> = ({
  image,
  onClose,
  initialTab = 'forge',
  anchorPosition,
}) => {
  const {
    performImageEdit,
    performPropGeneration,
    performUpscale,
    applyFestiveOverdrive,
    performStyleTransfer,
    applySmartCrop,
    resetCrop,
    neuralTemperature,
    reanalyzeImage,
    performBackgroundGeneration,
    images,
    addToReel,
    applyCompositionRule,
  } = useStore();

  const [prompt, setPrompt] = useState('');
  const [command, setCommand] = useState('');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isRefining, setIsRefining] = useState(false);

  // Upscale Creativity State
  const [upscaleCreativity, setUpscaleCreativity] = useState(0.2);

  const atmospheres = [
    {
      id: 'snow',
      name: 'Blizzard Protocol',
      mode: 'snow' as const,
      desc: 'Volumetric snow and frost accumulation',
      icon: Snowflake,
    },
    {
      id: 'lights',
      name: 'Magic String Lights',
      mode: 'lights' as const,
      desc: 'Warm bokeh and glowing holiday orbs',
      icon: Stars,
    },
    {
      id: 'magic',
      name: 'Full Holiday Overdrive',
      mode: 'magic' as const,
      desc: 'Maximum festive spirit neural remix',
      icon: Sparkles,
    },
  ];

  const cameraAngles = [
    {
      id: 'dutch',
      name: 'Dutch Angle',
      prompt:
        'Remix this image with a dramatic Dutch Angle (tilted horizon) to create dynamic tension and energy.',
      icon: RotateCcw,
      color: 'text-orange-400',
    },
    {
      id: 'low',
      name: 'Low Angle',
      prompt:
        "Remix this image from a low angle looking up (worm's-eye view) to make the subject appear powerful and imposing.",
      icon: ArrowUp,
      color: 'text-indigo-400',
    },
    {
      id: 'overhead',
      name: 'Overhead',
      prompt:
        "Remix this image from a direct top-down overhead perspective (God's eye view/Flat Lay).",
      icon: ArrowDown,
      color: 'text-cyan-400',
    },
    {
      id: 'wide',
      name: 'Ultra Wide',
      prompt:
        'Remix this image using a wide-angle lens to show more of the surrounding environment and create depth.',
      icon: Maximize2,
      color: 'text-emerald-400',
    },
    {
      id: 'close',
      name: 'Extreme Close-Up',
      prompt:
        'Remix this image as an extreme close-up detail shot, focusing intensely on the texture and features.',
      icon: Focus,
      color: 'text-rose-400',
    },
  ];

  const stylePresets = [
    {
      id: 'cyber',
      name: 'Cyberpunk',
      prompt:
        'Neural Cyberpunk Remix: Infuse with neon bioluminescence, rainy high-tech urban atmosphere, and chrome surfaces.',
      icon: Zap,
      color: 'text-cyan-400',
      glow: 'shadow-cyan-500/20',
    },
    {
      id: 'oil',
      name: 'Oil Painting',
      prompt:
        'Classical Oil Painting: Re-render with thick impasto brushstrokes, rich pigment textures, and dramatic chiaroscuro lighting.',
      icon: Palette,
      color: 'text-amber-500',
      glow: 'shadow-amber-500/20',
    },
    {
      id: 'festive',
      name: 'Festive Magic',
      prompt:
        'Holiday Enchantment: Add warm glowing bokeh, magical snowflakes, and a cozy cinematic Christmas atmosphere.',
      icon: Snowflake,
      color: 'text-rose-400',
      glow: 'shadow-rose-500/20',
    },
    {
      id: 'sketch',
      name: 'Ink Sketch',
      prompt:
        'Architectural Ink Sketch: Convert to a detailed hand-drawn ink and charcoal illustration on vintage paper.',
      icon: PenTool,
      color: 'text-slate-400',
      glow: 'shadow-slate-500/20',
    },
    {
      id: 'ghibli',
      name: 'Anime Studio',
      prompt:
        'Nostalgic Anime Style: Transform into a lush, hand-painted Ghibli-inspired world with vibrant blues and fluffy clouds.',
      icon: Ghost,
      color: 'text-emerald-400',
      glow: 'shadow-emerald-500/20',
    },
    {
      id: 'vapor',
      name: 'Vaporwave',
      prompt:
        'Vaporwave Aesthetic: Apply a surreal retro-future remix with pink/purple gradients, digital artifacts, and lo-fi glow.',
      icon: Sun,
      color: 'text-fuchsia-400',
      glow: 'shadow-fuchsia-500/20',
    },
    {
      id: 'clay',
      name: 'Claymation',
      prompt:
        'Plasticine Stop-Motion: Render as a tactile clay model with soft fingerprints, rounded edges, and studio lighting.',
      icon: Box,
      color: 'text-orange-400',
      glow: 'shadow-orange-500/20',
    },
    {
      id: 'pixel',
      name: 'Pixel Art',
      prompt:
        '16-bit Pixel Art: Convert to a retro high-quality pixel art style with a limited color palette and dithering.',
      icon: Grid,
      color: 'text-purple-400',
      glow: 'shadow-purple-500/20',
    },
  ];

  const [styleRefBase64, setStyleRefBase64] = useState<string | null>(null);
  const [styleRefMimeType, setStyleRefMimeType] = useState<string | null>(null);
  const [styleIntensity, setStyleIntensity] = useState(0.8);
  const [showCanvasPicker, setShowCanvasPicker] = useState(false);
  const styleInputRef = useRef<HTMLInputElement>(null);

  // --- BRUSH & MASK STATE ---
  const [tool, setTool] = useState<'pointer' | 'brush'>('brush');
  const [brushSize, setBrushSize] = useState(40);
  const [maskOpacity, setMaskOpacity] = useState(0.5);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasMaskData, setHasMaskData] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const thumbRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // Visible overlay
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null); // Hidden binary mask

  // Initialize masks when switching to Inpaint tab
  useEffect(() => {
    if (!maskCanvasRef.current) {
      maskCanvasRef.current = document.createElement('canvas');
    }
    // Small delay to allow DOM to settle
    const timer = setTimeout(initMaskCanvases, 100);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const initMaskCanvases = () => {
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
  };

  const startDrawing = (e: React.MouseEvent) => {
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
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const ctx = canvasRef.current?.getContext('2d');
      const mCtx = maskCanvasRef.current?.getContext('2d');
      ctx?.closePath();
      mCtx?.closePath();
      setIsDrawing(false);
    }
  };

  const draw = (e: React.MouseEvent) => {
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
  };

  const clearMask = () => {
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
  };

  const handleThumbnailClick = (e: React.MouseEvent) => {
    if (tool === 'brush') return;
    if (!thumbRef.current) return;
    const rect = thumbRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setAnchor({ x, y });
    if (
      activeTab !== 'inpaint' &&
      activeTab !== 'upscale' &&
      activeTab !== 'atmosphere' &&
      activeTab !== 'camera' &&
      activeTab !== 'frame'
    )
      setActiveTab('inpaint');
  };

  const handleApplyEdit = async (customPrompt?: string, modeOverride?: 'remix' | 'inpaint') => {
    const basePrompt = customPrompt || prompt || command;
    if (!basePrompt.trim() || neuralTemperature > 0) return;

    const currentMode = modeOverride || (activeTab === 'inpaint' ? 'inpaint' : 'remix');
    let maskBase64: string | undefined = undefined;

    if (currentMode === 'inpaint' && maskCanvasRef.current && hasMaskData) {
      maskBase64 = maskCanvasRef.current.toDataURL('image/png');
    }

    let finalPrompt = basePrompt;
    if (currentMode === 'inpaint' && anchor && !maskBase64) {
      finalPrompt = `INPAINT: Focus on (x:${Math.round(anchor.x)}%, y:${Math.round(anchor.y)}%). ${basePrompt}`;
    }

    await performImageEdit(image.id, finalPrompt, 'edit', 'gemini-2.0-flash', maskBase64);
    setPrompt('');
    setCommand('');
    onClose();
  };

  const handleStyleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setStyleRefBase64(result.split(',')[1]);
      setStyleRefMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleCanvasStyleSelect = async (img: ImageAsset) => {
    try {
      let blob: Blob | null = null;
      if (img.url.startsWith('local://')) {
        const id = img.url.replace('local://', '');
        const data = await assetDB.get(id);
        if (data instanceof Blob) blob = data;
        else if (typeof data === 'string') {
          setStyleRefBase64(data.startsWith('data:') ? data.split(',')[1] : data);
          setStyleRefMimeType('image/png');
          setShowCanvasPicker(false);
          return;
        }
      } else if (img.url.startsWith('data:')) {
        setStyleRefBase64(img.url.split(',')[1]);
        setStyleRefMimeType('image/png');
        setShowCanvasPicker(false);
        return;
      } else {
        // For remote URLs (rare in this app)
        const res = await fetch(img.url);
        blob = await res.blob();
      }

      if (blob) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          setStyleRefBase64(res.split(',')[1]);
          setStyleRefMimeType(blob!.type);
          setShowCanvasPicker(false);
        };
        reader.readAsDataURL(blob);
      }
    } catch (e) {
      console.error('Canvas Style Select Failed', e);
    }
  };

  const handleApplyStyle = async (specificPrompt?: string) => {
    const base = specificPrompt || prompt || command;

    if (styleRefBase64 && styleRefMimeType) {
      const intensityPart = `Style Intensity: ${Math.round(styleIntensity * 100)}%.`;
      const instr = base
        ? base
        : 'Transfer the style from the reference image to the source image.';
      const finalPrompt = `${intensityPart} ${instr}`;

      await performStyleTransfer(image.id, finalPrompt, styleRefBase64, styleRefMimeType);
      onClose();
    } else {
      const fallbackPrompt = base || 'Apply a beautiful artistic style transfer.';
      await handleApplyEdit(fallbackPrompt);
    }
  };

  const handleForgeProp = async () => {
    const propPrompt = prompt || command;
    if (!propPrompt.trim() || neuralTemperature > 0) return;
    await performPropGeneration(propPrompt, image.id);
    setPrompt('');
    setCommand('');
    onClose();
  };

  const handleBackgroundGen = async () => {
    if (neuralTemperature > 0) return;
    await performBackgroundGeneration(image.id);
    onClose();
  };

  const handleUpscaleTrigger = async () => {
    if (neuralTemperature > 0) return;
    await performUpscale(image.id, upscaleCreativity);
    onClose();
  };

  const handleFestiveTrigger = async (mode: 'snow' | 'lights' | 'magic') => {
    if (neuralTemperature > 0) return;
    await applyFestiveOverdrive(image.id, mode);
  };

  const handleRefinePrompt = async () => {
    const textToRefine = prompt || command;
    if (!textToRefine.trim() || isRefining) return;
    setIsRefining(true);
    try {
      // Using governed service call instead of direct instantiation
      const refined = await refinePrompt(textToRefine);
      if (refined) {
        if (prompt) setPrompt(refined);
        else setCommand(refined);
      }
    } catch (e) {
      console.error('Prompt Refinement Failed', e);
    } finally {
      setIsRefining(false);
    }
  };

  const positionStyle = anchorPosition
    ? {
        left: anchorPosition.x,
        top: anchorPosition.y - 20,
        transform: 'translate(-50%, -100%)',
      }
    : {
        left: image.x + (image.width * image.scale) / 2,
        top: image.y - 180,
        transform: 'translateX(-50%)',
      };

  const hasAnalysis = !!image.composition;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="absolute z-[500] pointer-events-auto"
       
      style={positionStyle}
    >
      <div className="relative p-1 bg-black/95 backdrop-blur-3xl border border-indigo-500/30 rounded-[32px] shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col w-[440px] overflow-hidden">
        {/* --- HEADER TABS --- */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
          <div className="flex gap-1 p-1 bg-black/40 rounded-full border border-white/5 relative overflow-x-auto custom-scrollbar max-w-[320px]">
            <TabItem
              active={activeTab === 'forge'}
              onClick={() => setActiveTab('forge')}
              icon={PenTool}
              label="Forge"
            />
            <TabItem
              active={activeTab === 'frame'}
              onClick={() => setActiveTab('frame')}
              icon={LayoutTemplate}
              label="Frame"
            />
            <TabItem
              active={activeTab === 'style'}
              onClick={() => setActiveTab('style')}
              icon={Palette}
              label="Remix"
            />
            <TabItem
              active={activeTab === 'camera'}
              onClick={() => setActiveTab('camera')}
              icon={Video}
              label="Camera"
            />
            <TabItem
              active={activeTab === 'inpaint'}
              onClick={() => setActiveTab('inpaint')}
              icon={Target}
              label="Inpaint"
            />
            <TabItem
              active={activeTab === 'backdrop'}
              onClick={() => setActiveTab('backdrop')}
              icon={Monitor}
              label="Backdrop"
            />
            <TabItem
              active={activeTab === 'atmosphere'}
              onClick={() => setActiveTab('atmosphere')}
              icon={CloudRain}
              label="FX"
            />
            <TabItem
              active={activeTab === 'upscale'}
              onClick={() => setActiveTab('upscale')}
              icon={Maximize2}
              label="4K"
            />
          </div>

          <div className="flex items-center gap-1 ml-2">
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => addToReel([image.id])}
              className="w-8 h-8 flex items-center justify-center bg-white/5 hover:text-indigo-400 rounded-full transition-all"
              title="Add to Reel"
            >
              <Film size={14} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(244, 63, 94, 0.2)' }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-white/5 hover:text-rose-400 rounded-full transition-all"
            >
              <X size={16} />
            </motion.button>
          </div>
        </div>

        {/* --- INPAINT EDITOR (BRUSH + MASK) --- */}
        <AnimatePresence>
          {activeTab === 'inpaint' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-5 pt-5 overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <div className="flex gap-2 p-0.5 bg-black/40 rounded-lg border border-white/5">
                    <ToolBtn
                      active={tool === 'pointer'}
                      onClick={() => setTool('pointer')}
                      icon={MousePointer2}
                    />
                    <ToolBtn
                      active={tool === 'brush'}
                      onClick={() => setTool('brush')}
                      icon={Brush}
                    />
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
                   
                  style={{ aspectRatio: `${image.width} / ${image.height}` }}
                  className={`relative w-full max-h-[300px] bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-inner group transition-all duration-300 ${tool === 'brush' ? 'cursor-none' : 'cursor-crosshair'}`}
                >
                  <img
                    src={image.url}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity pointer-events-none"
                    alt="Source image for inpainting"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none transition-opacity"
                     
                    style={{ opacity: maskOpacity }}
                  />

                  {tool === 'brush' && (
                    <div
                      className="absolute border border-white/80 rounded-full pointer-events-none z-50 bg-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.4)]"
                       
                      style={{
                        width: brushSize,
                        height: brushSize,
                        left: mousePos.x,
                        top: mousePos.y,
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  )}

                  <AnimatePresence>
                    {anchor && tool === 'pointer' && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
                         
                        style={{ left: `${anchor.x}%`, top: `${anchor.y}%` }}
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- FRAME / COMPOSITION TAB --- */}
        <AnimatePresence>
          {activeTab === 'frame' && (
            <motion.div
              key="frame"
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
          )}
        </AnimatePresence>

        {/* --- PROMPT INPUT (Hidden for Frame Tab) --- */}
        {activeTab !== 'frame' && (
          <div className="px-5 pt-5 pb-2">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400">
                <Lightning size={14} className={neuralTemperature > 0 ? 'animate-pulse' : ''} />
              </div>
              <input
                type="text"
                value={command}
                onChange={e => setCommand(e.target.value)}
                onKeyDown={e =>
                  e.key === 'Enter' &&
                  (activeTab === 'style'
                    ? handleApplyStyle()
                    : activeTab === 'prop'
                      ? handleForgeProp()
                      : handleApplyEdit())
                }
                placeholder={
                  activeTab === 'inpaint'
                    ? 'Describe modifications for the mask...'
                    : activeTab === 'style'
                      ? 'Describe a custom artistic style...'
                      : 'Enter custom neural command...'
                }
                className="w-full bg-black/40 border border-white/10 rounded-full pl-10 pr-24 py-3 text-[11px] font-mono text-white outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 shadow-inner transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleRefinePrompt}
                  disabled={!command.trim() || isRefining}
                  className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-full transition-all disabled:opacity-0"
                  title="Refine Command"
                >
                  {isRefining ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                </motion.button>
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: 'rgba(79, 70, 229, 1)',
                    boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  onClick={() =>
                    activeTab === 'style'
                      ? handleApplyStyle()
                      : activeTab === 'prop'
                        ? handleForgeProp()
                        : handleApplyEdit()
                  }
                  disabled={!command.trim() || neuralTemperature > 0}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-30 shadow-lg shadow-indigo-600/20"
                >
                  <Send size={10} /> RUN
                </motion.button>
              </div>
            </div>
          </div>
        )}

        <div className="p-5 flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {activeTab === 'forge' && (
              <motion.div
                key="forge"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase text-indigo-400 tracking-[0.2em]">
                      Neural Presets
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        id: 'hdr',
                        name: 'Ultra HDR',
                        prompt:
                          'Enhance details, expand color range, and optimize micro-contrast for a vivid high-dynamic-range look.',
                        icon: Lightning,
                        color: 'text-cyan-400',
                      },
                      {
                        id: 'cine',
                        name: 'Cinematic',
                        prompt:
                          'Enhance the colors and add a cinematic bokeh effect with soft volumetric lighting.',
                        icon: Film,
                        color: 'text-fuchsia-400',
                      },
                      {
                        id: 'night',
                        name: 'Moonlight',
                        prompt:
                          'Transform into a serene moonlit night scene with deep blue shadows and soft volumetric light.',
                        icon: Moon,
                        color: 'text-indigo-400',
                      },
                      {
                        id: 'sunset',
                        name: 'Golden Hour',
                        prompt:
                          'Apply warm cinematic sunset lighting with long shadows and a glowing atmospheric haze.',
                        icon: Sun,
                        color: 'text-amber-500',
                      },
                      {
                        id: 'storm',
                        name: 'Stormy',
                        prompt:
                          'Moody storm atmosphere: dramatic dark clouds, cool color grading, and dynamic high-contrast lighting.',
                        icon: CloudLightning,
                        color: 'text-slate-400',
                      },
                    ].map(action => (
                      <motion.button
                        key={action.id}
                        whileHover={{
                          scale: 1.02,
                          backgroundColor: 'rgba(255,255,255,0.08)',
                          x: 4,
                        }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        onClick={() => handleApplyEdit(action.prompt)}
                        className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 transition-all text-left"
                      >
                        <action.icon size={16} className={action.color} />
                        <span className="text-[9px] font-black uppercase text-slate-300 tracking-wider">
                          {action.name}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-white/10 my-1" />

                <div className="relative group">
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="Describe a full custom visual transformation..."
                    className="w-full h-24 bg-black/60 border border-white/10 rounded-2xl p-4 text-[11px] font-mono text-white outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 resize-none shadow-inner transition-all"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1, y: -1, backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleRefinePrompt}
                    disabled={!prompt.trim() || isRefining}
                    className="absolute bottom-3 right-3 p-2 bg-indigo-500/10 text-indigo-400 rounded-lg transition-all disabled:opacity-0"
                  >
                    {isRefining ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Lightbulb size={14} />
                    )}
                  </motion.button>
                </div>
                <motion.button
                  whileHover={{
                    scale: 1.02,
                    y: -2,
                    backgroundColor: 'rgba(79, 70, 229, 0.9)',
                    boxShadow: '0 10px 30px rgba(79, 70, 229, 0.4)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  onClick={() => handleApplyEdit()}
                  disabled={!prompt.trim() || neuralTemperature > 0}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all shadow-xl disabled:opacity-30"
                >
                  {neuralTemperature > 0 ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  Execute_Neural_Remix
                </motion.button>
              </motion.div>
            )}

            {activeTab === 'style' && (
              <motion.div
                key="style"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {showCanvasPicker ? (
                  <div className="space-y-3 animate-in slide-in-from-right duration-300">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black uppercase text-indigo-400 tracking-[0.2em]">
                        Select Source
                      </span>
                      <button
                        onClick={() => setShowCanvasPicker(false)}
                        className="text-[8px] uppercase text-slate-500 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                      {images
                        .filter(i => i.id !== image.id)
                        .map(img => (
                          <motion.button
                            key={img.id}
                            whileHover={{ scale: 1.05 }}
                            onClick={() => handleCanvasStyleSelect(img)}
                            className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-white/10 group"
                          >
                            <img
                              src={img.url}
                              className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                              alt={img.tags?.[0] || 'Style reference'}
                            />
                          </motion.button>
                        ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black uppercase text-indigo-400 tracking-[0.2em]">
                          Neural Style Fusion
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {stylePresets.map(s => (
                          <motion.button
                            key={s.id}
                            whileHover={{
                              scale: 1.05,
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              y: -2,
                            }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                            onClick={() => handleApplyStyle(s.prompt)}
                            className={`relative p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-2 group transition-all shadow-lg ${s.glow}`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none rounded-2xl" />
                            <s.icon
                              size={20}
                              className={`${s.color} group-hover:scale-110 transition-transform`}
                            />
                            <span className="text-[9px] font-black uppercase text-slate-300 tracking-[0.1em] group-hover:text-white text-center">
                              {s.name}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black uppercase text-indigo-400 tracking-[0.2em]">
                          Custom Reference
                        </span>
                        {styleRefBase64 && (
                          <motion.button
                            whileHover={{ scale: 1.1, color: '#f43f5e' }}
                            onClick={() => setStyleRefBase64(null)}
                            className="text-[8px] text-rose-500/60 hover:text-rose-500 font-black uppercase transition-colors"
                          >
                            Clear_Reference
                          </motion.button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => setShowCanvasPicker(true)}
                          whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
                          className="flex-1 py-3 border border-dashed border-indigo-500/30 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-indigo-500/60 transition-all group"
                        >
                          <Layout
                            size={14}
                            className="text-indigo-400 group-hover:scale-110 transition-transform"
                          />
                          <span className="text-[8px] font-black uppercase text-slate-500 group-hover:text-indigo-300">
                            From Canvas
                          </span>
                        </motion.button>
                        <motion.button
                          onClick={() => styleInputRef.current?.click()}
                          whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
                          className="flex-1 py-3 border border-dashed border-indigo-500/30 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-indigo-500/60 transition-all group"
                        >
                          <Upload
                            size={14}
                            className="text-indigo-400 group-hover:scale-110 transition-transform"
                          />
                          <span className="text-[8px] font-black uppercase text-slate-500 group-hover:text-indigo-300">
                            Upload File
                          </span>
                        </motion.button>
                        <input
                          type="file"
                          ref={styleInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleStyleUpload}
                          aria-label="Upload style reference image"
                        />
                      </div>

                      {styleRefBase64 && (
                        <div className="relative aspect-[4/1] w-full bg-slate-900 border border-indigo-500/50 rounded-lg overflow-hidden">
                          <img
                            src={`data:${styleRefMimeType};base64,${styleRefBase64}`}
                            className="w-full h-full object-cover opacity-60"
                            alt="Style reference preview"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <span className="text-[8px] font-black text-white uppercase tracking-widest bg-indigo-600/80 px-2 py-0.5 rounded shadow-sm">
                              Reference Active
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 group/slider">
                        <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                          <span className="uppercase tracking-widest group-hover/slider:text-slate-300 transition-colors">
                            Fusion_Intensity
                          </span>
                          <span className="text-indigo-400 font-black">
                            {Math.round(styleIntensity * 100)}%
                          </span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full relative cursor-pointer group">
                          <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.05"
                            value={styleIntensity}
                            onChange={e => setStyleIntensity(parseFloat(e.target.value))}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                            aria-label="Style Fusion Intensity"
                          />
                          <div
                            className="h-full bg-indigo-500 rounded-full group-hover:bg-indigo-400 transition-all duration-200 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                             
                            style={{ width: `${((styleIntensity - 0.1) / (1.0 - 0.1)) * 100}%` }}
                          />
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:scale-125"
                             
                            style={{
                              left: `${((styleIntensity - 0.1) / (1.0 - 0.1)) * 100}%`,
                              transform: 'translate(-50%, -50%)',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{
                        scale: 1.02,
                        y: -2,
                        backgroundColor: 'rgba(99, 102, 241, 1)',
                        boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)',
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      onClick={() => handleApplyStyle()}
                      disabled={
                        (!styleRefBase64 && !prompt.trim() && !command.trim()) ||
                        neuralTemperature > 0
                      }
                      className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white rounded-full flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl transition-all disabled:opacity-30"
                    >
                      {neuralTemperature > 0 ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Layers size={16} />
                      )}
                      Initiate_Fusion
                    </motion.button>
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'camera' && (
              <motion.div
                key="camera"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                    Cinematic Perspectives
                  </h3>
                  <p className="text-[9px] font-mono text-slate-600 px-1">
                    Neural re-projection of the scene geometry.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {cameraAngles.map(angle => (
                    <motion.button
                      key={angle.id}
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)', x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      onClick={() => handleApplyEdit(angle.prompt)}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-4 transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center border border-white/5">
                        <angle.icon size={18} className={angle.color} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider group-hover:text-white block mb-0.5">
                          {angle.name}
                        </span>
                        <span className="text-[8px] font-mono text-slate-600 uppercase tracking-tight opacity-70">
                          AI Re-Framing Protocol
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'atmosphere' && (
              <motion.div
                key="atmosphere"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 gap-3"
              >
                {atmospheres.map(atm => (
                  <motion.button
                    key={atm.id}
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(79, 70, 229, 0.15)', x: 6 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    onClick={() => {
                      handleFestiveTrigger(atm.mode);
                      onClose();
                    }}
                    className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 text-left group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white group-hover:scale-110 transition-all shadow-lg">
                      <atm.icon size={24} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase text-white tracking-widest group-hover:text-indigo-400 transition-colors">
                        {atm.name}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 uppercase">
                        {atm.desc}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}

            {activeTab === 'backdrop' && (
              <motion.div
                key="backdrop"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-6 border-2 border-dashed border-indigo-500/20 bg-indigo-500/5 rounded-3xl flex flex-col items-center gap-4 transition-colors"
                >
                  <div className="w-16 h-16 rounded-full bg-indigo-600/10 flex items-center justify-center text-indigo-400">
                    <Monitor size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">
                      Ambient_Synthesis
                    </h3>
                    <p className="text-[9px] font-mono text-slate-500 uppercase leading-relaxed">
                      Generate a 16:9 cinematic backdrop derived from the semantic DNA of this
                      asset.
                    </p>
                  </div>
                </motion.div>

                <motion.button
                  whileHover={{
                    scale: 1.02,
                    y: -2,
                    backgroundColor: 'rgba(79, 70, 229, 1)',
                    boxShadow: '0 10px 40px rgba(99, 102, 241, 0.5)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  onClick={handleBackgroundGen}
                  disabled={neuralTemperature > 0}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-full flex items-center justify-center gap-3 text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl disabled:opacity-30"
                >
                  {neuralTemperature > 0 ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Sparkles size={18} />
                  )}
                  Generate_Backdrop
                </motion.button>
              </motion.div>
            )}

            {activeTab === 'upscale' && (
              <motion.div
                key="upscale"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-6 border-2 border-dashed border-indigo-500/20 bg-indigo-500/5 rounded-3xl flex flex-col items-center gap-4 transition-colors"
                >
                  <div className="w-16 h-16 rounded-full bg-indigo-600/10 flex items-center justify-center text-indigo-400">
                    <Maximize2 size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">
                      Neural_4K_Upscale
                    </h3>
                    <p className="text-[9px] font-mono text-slate-500 uppercase leading-relaxed">
                      Synthesize high-frequency detail using Gemini 3 Pro Vision.
                    </p>
                  </div>
                </motion.div>

                <div className="space-y-2 px-2">
                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                    <span className="uppercase tracking-widest">Detail_Synthesis</span>
                    <span className="text-indigo-400 font-black">
                      {Math.round(upscaleCreativity * 100)}%
                    </span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full relative">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={upscaleCreativity}
                      onChange={e => setUpscaleCreativity(parseFloat(e.target.value))}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                      aria-label="Detail Synthesis Level"
                    />
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-200 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                       
                      style={{ width: `${upscaleCreativity * 100}%` }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md pointer-events-none transition-all duration-200"
                       
                      style={{
                        left: `${upscaleCreativity * 100}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[7px] text-slate-600 uppercase font-black tracking-widest pt-1">
                    <span>Strict Fidelity</span>
                    <span>Hallucinate Detail</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{
                    scale: 1.02,
                    y: -2,
                    backgroundColor: 'rgba(79, 70, 229, 1)',
                    boxShadow: '0 10px 40px rgba(99, 102, 241, 0.5)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  onClick={handleUpscaleTrigger}
                  disabled={neuralTemperature > 0}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-full flex items-center justify-center gap-3 text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl disabled:opacity-30"
                >
                  {neuralTemperature > 0 ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Sparkles size={18} />
                  )}
                  Initiate_4K_Forge
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-6 py-3 bg-indigo-500/5 flex items-center justify-between border-t border-white/5">
          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${neuralTemperature > 0 ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]' : 'bg-slate-600'}`}
            />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              {neuralTemperature > 0 ? 'Neural_Synthesis_Active' : 'Forge_Standby'}
            </span>
          </div>
        </div>
      </div>
      <div className="w-5 h-5 bg-black/95 border-r border-b border-indigo-500/30 rotate-45 absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-[-1] shadow-2xl" />
    </motion.div>
  );
};

const TabItem = ({ active, onClick, icon: Icon, label }: any) => (
  <motion.button
    whileHover={{ backgroundColor: active ? 'rgba(79, 70, 229, 1)' : 'rgba(255,255,255,0.08)' }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all relative z-10 ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
  >
    <span className="flex items-center gap-1.5 relative z-10">
      <Icon size={11} /> {label}
    </span>
    {active && (
      <motion.div
        layoutId="nano-active-tab"
        className="absolute inset-0 bg-indigo-600 rounded-full shadow-lg"
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    )}
  </motion.button>
);

const ToolBtn = ({ active, onClick, icon: Icon }: any) => (
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

const InpaintActionBtn = ({ icon: Icon, label, onClick, color, disabled }: any) => (
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

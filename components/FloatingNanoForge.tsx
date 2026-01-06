import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import {
  X,
  Wand2,
  Palette,
  Eraser,
  Maximize,
  Cloud,
  Layout,
  Camera,
  Image as ImageIcon,
  Move,
} from 'lucide-react';
import {
  ForgeTab,
  StyleTab,
  InpaintTab,
  UpscaleTab,
  AtmosphereTab,
  BackdropTab,
  CameraTab,
  FrameTab,
  ForgeTabType,
  FloatingNanoForgeProps,
} from './forge-tabs';

export const FloatingNanoForge: React.FC<FloatingNanoForgeProps> = ({
  image,
  onClose,
  initialTab = 'forge',
  anchorPosition,
}) => {
  const [activeTab, setActiveTab] = useState<ForgeTabType>(initialTab);
  const [isMinimized, setIsMinimized] = useState(false);

  // Local state for tab components
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [creativity, setCreativity] = useState(50);
  const [styleReference, setStyleReference] = useState<string | null>(null);
  const [styleMime, setStyleMime] = useState<string | null>(null);

  // Store actions
  const performImageEdit = useStore(state => state.performImageEdit);
  const performUpscale = useStore(state => state.performUpscale);
  const performBackgroundGeneration = useStore(state => state.performBackgroundGeneration);
  const applyFestiveOverdrive = useStore(state => state.applyFestiveOverdrive);
  const reanalyzeImage = useStore(state => state.reanalyzeImage);
  const applyCompositionRule = useStore(state => state.applyCompositionRule);
  const resetCrop = useStore(state => state.resetCrop);
  const neuralTemperature = useStore(state => state.neuralTemperature);
  const images = useStore(state => state.images);

  // Auto-select tab if image state requires it
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const tabs: { id: ForgeTabType; icon: React.ElementType; label: string }[] = [
    { id: 'forge', icon: Wand2, label: 'Forge' },
    { id: 'style', icon: Palette, label: 'Remix' },
    { id: 'inpaint', icon: Eraser, label: 'Inpaint' },
    { id: 'upscale', icon: Maximize, label: 'Upscale' },
    { id: 'atmosphere', icon: Cloud, label: 'Atmosphere' },
    { id: 'frame', icon: Layout, label: 'Frame' },
    { id: 'backdrop', icon: ImageIcon, label: 'Backdrop' },
    { id: 'camera', icon: Camera, label: 'Lens' },
  ];

  // Handlers
  const handleEdit = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    try {
      await performImageEdit(image.id, prompt, 'edit');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefine = async () => {
    // TODO: Implement prompt refinement with AI
    console.debug('Refining prompt:', prompt);
  };

  const handleApplyStyle = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    try {
      await performImageEdit(image.id, prompt, 'style');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStyleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setStyleReference(reader.result as string);
        setStyleMime(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectCanvasStyle = (img: typeof image) => {
    setStyleReference(img.url);
    setStyleMime('image/jpeg');
  };

  const handleApplyInpaint = async (_mask: string) => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    try {
      await performImageEdit(image.id, prompt, 'inpaint');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpscale = async () => {
    setIsProcessing(true);
    try {
      await performUpscale(image.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFestiveTrigger = (mode: 'snow' | 'lights' | 'magic') => {
    applyFestiveOverdrive(image.id, mode);
  };

  const handleBackgroundGen = () => {
    performBackgroundGeneration(image.id);
  };

  const handleReanalyze = (imageId: string) => {
    reanalyzeImage(imageId);
  };

  const handleApplyCompositionRule = (imageId: string, rule: 'center' | 'thirds' | 'golden') => {
    applyCompositionRule(imageId, rule);
  };

  const handleResetCrop = (imageId: string) => {
    resetCrop(imageId);
  };

  const handleApplyEdit = (editPrompt: string) => {
    setPrompt(editPrompt);
    handleEdit();
  };

  // Available images for style reference (excluding current image)
  const availableImages = images.filter(img => img.id !== image.id);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="absolute z-50 flex shadow-[0_20px_60px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden glass-panel border border-white/10"
      style={{
        left: anchorPosition?.x || '50%',
        top: anchorPosition?.y || '50%',
        transform: 'translate(-50%, -50%)',
        width: isMinimized ? 'auto' : 800,
        height: isMinimized ? 'auto' : 500,
      }}
      drag
      dragMomentum={false}
    >
      {/* SIDEBAR */}
      <div className="w-16 bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col items-center py-4 gap-2 z-10">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-4 cursor-move active:cursor-grabbing border border-indigo-500/30">
          <Move size={18} />
        </div>

        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setIsMinimized(false);
            }}
            aria-label={tab.label}
            title={tab.label}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'hover:bg-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon size={18} />
            {/* Tooltip */}
            <div className="absolute left-14 bg-black/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 pointer-events-none">
              {tab.label}
            </div>
          </button>
        ))}

        <div className="flex-1" />

        <button
          onClick={onClose}
          aria-label="Close NanoForge"
          title="Close NanoForge"
          className="w-10 h-10 rounded-xl hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* CONTENT AREA */}
      {!isMinimized && (
        <div className="flex-1 bg-black/20 backdrop-blur-md relative flex flex-col min-w-0">
          {/* Header */}
          <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-white/5">
            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="text-indigo-400">Nano</span>Forge Array
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-[9px] text-indigo-300 border border-indigo-500/20 tracking-normal">
                {activeTab} module
              </span>
            </h2>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              ID: {image.id.substring(0, 8)}
            </div>
          </div>

          {/* Dynamic Content */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="h-full"
              >
                {activeTab === 'forge' && (
                  <ForgeTab
                    image={image}
                    prompt={prompt}
                    setPrompt={setPrompt}
                    isProcessing={isProcessing}
                    onEdit={handleEdit}
                    onRefine={handleRefine}
                  />
                )}
                {activeTab === 'style' && (
                  <StyleTab
                    image={image}
                    prompt={prompt}
                    setPrompt={setPrompt}
                    styleReference={styleReference}
                    styleMime={styleMime}
                    isProcessing={isProcessing}
                    onStyleUpload={handleStyleUpload}
                    onApplyStyle={handleApplyStyle}
                    availableImages={availableImages}
                    onSelectCanvasStyle={handleSelectCanvasStyle}
                  />
                )}
                {activeTab === 'inpaint' && (
                  <InpaintTab
                    image={image}
                    prompt={prompt}
                    setPrompt={setPrompt}
                    isProcessing={isProcessing}
                    onApplyInpaint={handleApplyInpaint}
                  />
                )}
                {activeTab === 'upscale' && (
                  <UpscaleTab
                    isProcessing={isProcessing}
                    creativity={creativity}
                    setCreativity={setCreativity}
                    onUpscale={handleUpscale}
                  />
                )}
                {activeTab === 'atmosphere' && (
                  <AtmosphereTab onFestiveTrigger={handleFestiveTrigger} onClose={onClose} />
                )}
                {activeTab === 'frame' && (
                  <FrameTab
                    image={image}
                    neuralTemperature={neuralTemperature}
                    onReanalyze={handleReanalyze}
                    onApplyCompositionRule={handleApplyCompositionRule}
                    onResetCrop={handleResetCrop}
                    onClose={onClose}
                  />
                )}
                {activeTab === 'backdrop' && (
                  <BackdropTab
                    neuralTemperature={neuralTemperature}
                    onBackgroundGen={handleBackgroundGen}
                  />
                )}
                {activeTab === 'camera' && <CameraTab onApplyEdit={handleApplyEdit} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
};

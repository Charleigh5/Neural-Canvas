import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Palette,
  X,
  Loader2,
  PenTool,
  Target,
  Send,
  Maximize2,
  CloudRain,
  Zap as Lightning,
  Monitor,
  Film,
  Video,
  LayoutTemplate,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { ImageAsset, ForgeTab } from '../types';
import { useForge } from '../hooks/useForge';
import { StyleTab } from './forge/tabs/StyleTab';
import { ForgeTab as ForgeTabComponent } from './forge/tabs/ForgeTab';
import { useInpaint } from '../hooks/useInpaint';
import { InpaintTab } from './forge/tabs/InpaintTab';
import { AtmosphereTab } from './forge/tabs/AtmosphereTab';
import { BackdropTab } from './forge/tabs/BackdropTab';
import { UpscaleTab } from './forge/tabs/UpscaleTab';
import { CameraTab } from './forge/tabs/CameraTab';
import { FrameTab } from './forge/tabs/FrameTab';
import { TabItem } from './forge/tabs/TabItem';
import { refinePrompt } from '../services/geminiService';
import { assetDB } from '../services/db';

interface FloatingNanoForgeProps {
  image: ImageAsset;
  onClose: () => void;

  initialTab?: ForgeTab;
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

    resetCrop,
    neuralTemperature,
    reanalyzeImage,
    performBackgroundGeneration,
    images,
    addToReel,
    applyCompositionRule,
  } = useStore();

  const {
    activeTab,
    setActiveTab,
    prompt,
    setPrompt,
    command,
    setCommand,
    isRefining,
    setIsRefining,
    showCanvasPicker,
    setShowCanvasPicker,
    styleRefBase64,
    setStyleRefBase64,
    styleRefMimeType,
    setStyleRefMimeType,
    styleIntensity,
    setStyleIntensity,
  } = useForge({ image, initialTab });

  // Upscale Creativity State
  const [upscaleCreativity, setUpscaleCreativity] = useState(0.2);

  const styleInputRef = useRef<HTMLInputElement>(null);

  // --- INPAINT HOOK ---
  const inpaint = useInpaint();

  useEffect(() => {
    const timer = setTimeout(inpaint.initMaskCanvases, 100);
    return () => clearTimeout(timer);
  }, [activeTab, inpaint.initMaskCanvases]);

  const handleApplyEdit = async (customPrompt?: string, modeOverride?: 'remix' | 'inpaint') => {
    const basePrompt = customPrompt || prompt || command;
    if (!basePrompt.trim() || neuralTemperature > 0) return;

    const currentMode = modeOverride || (activeTab === 'inpaint' ? 'inpaint' : 'remix');
    let maskBase64: string | undefined = undefined;

    if (currentMode === 'inpaint' && inpaint.maskCanvasRef.current && inpaint.hasMaskData) {
      maskBase64 = inpaint.maskCanvasRef.current.toDataURL('image/png');
    }

    let finalPrompt = basePrompt;
    if (currentMode === 'inpaint' && inpaint.anchor && !maskBase64) {
      finalPrompt = `INPAINT: Focus on (x:${Math.round(inpaint.anchor.x)}%, y:${Math.round(inpaint.anchor.y)}%). ${basePrompt}`;
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
        const currentBlob = blob;
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          setStyleRefBase64(res.split(',')[1]);
          setStyleRefMimeType(currentBlob.type);
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
              <InpaintTab
                image={image}
                {...inpaint}
                handleThumbnailClick={e => inpaint.handleThumbnailClick(e, activeTab, setActiveTab)}
                prompt={prompt}
                command={command}
                handleApplyEdit={handleApplyEdit}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- FRAME / COMPOSITION TAB --- */}
        <AnimatePresence>
          {activeTab === 'frame' && (
            <FrameTab
              image={image}
              reanalyzeImage={reanalyzeImage}
              applyCompositionRule={applyCompositionRule}
              resetCrop={resetCrop}
              neuralTemperature={neuralTemperature}
              onClose={onClose}
            />
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
              <ForgeTabComponent
                prompt={prompt}
                setPrompt={setPrompt}
                isRefining={isRefining}
                handleRefinePrompt={handleRefinePrompt}
                handleApplyEdit={handleApplyEdit}
                neuralTemperature={neuralTemperature}
              />
            )}

            {activeTab === 'style' && (
              <StyleTab
                image={image}
                images={images}
                showCanvasPicker={showCanvasPicker}
                setShowCanvasPicker={setShowCanvasPicker}
                styleRefBase64={styleRefBase64}
                setStyleRefBase64={setStyleRefBase64}
                styleRefMimeType={styleRefMimeType}
                styleIntensity={styleIntensity}
                setStyleIntensity={setStyleIntensity}
                prompt={prompt}
                command={command}
                neuralTemperature={neuralTemperature}
                handleCanvasStyleSelect={handleCanvasStyleSelect}
                handleStyleUpload={handleStyleUpload}
                handleApplyStyle={handleApplyStyle}
                styleInputRef={styleInputRef}
              />
            )}

            {activeTab === 'camera' && <CameraTab onSelect={handleApplyEdit} />}

            {activeTab === 'atmosphere' && (
              <AtmosphereTab
                onSelect={mode => {
                  handleFestiveTrigger(mode);
                  onClose();
                }}
              />
            )}

            {activeTab === 'backdrop' && (
              <BackdropTab onGenerate={handleBackgroundGen} neuralTemperature={neuralTemperature} />
            )}

            {activeTab === 'upscale' && (
              <UpscaleTab
                creativity={upscaleCreativity}
                setCreativity={setUpscaleCreativity}
                onUpscale={handleUpscaleTrigger}
                neuralTemperature={neuralTemperature}
              />
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

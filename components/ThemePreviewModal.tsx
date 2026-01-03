import React from 'react';
import { useStore } from '../store/useStore';
import { X, Gift, Snowflake, Zap, Palette, Monitor, Film } from 'lucide-react';
import {
  AuroraBorealis,
  BlizzardProtocol,
  ChimneyVents,
  IcicleFormation,
  YuleFireplace,
  DigitalFrost,
} from './quad-view/Atmosphere';
import { FestiveStringLights, BezelGarland, TreeDecorations } from './quad-view/Decorations';
import { NeuralSentimentScanner, PolarTelemetry, GiftUnboxOverlay } from './quad-view/HUD';
import { BezelTheme } from '../types';

interface ThemePreviewModalProps {
  onClose: () => void;
}

export const ThemePreviewModal: React.FC<ThemePreviewModalProps> = ({ onClose }) => {
  const { reel, images, playback } = useStore();

  // Get the first image of the reel
  const firstImageId = reel[0];
  const firstImage = images.find(i => i.id === firstImageId);
  const theme = playback.bezelTheme || 'standard';
  const customConfig = playback.activeThemeConfig;

  // Determine Bezel Styles
  const getBezelStyles = () => {
    if (theme === 'christmas')
      return { border: '12px solid #3f0e0e', boxShadow: '0 0 100px rgba(220,38,38,0.3)' };
    if (theme === 'gold')
      return { border: '6px solid #b45309', boxShadow: '0 0 50px rgba(234,179,8,0.4)' };
    if (theme === 'frost')
      return { border: '4px solid #155e75', boxShadow: '0 0 50px rgba(34,211,238,0.3)' };
    if (theme === 'candy')
      return { border: '8px solid #ec4899', boxShadow: '0 0 50px rgba(236,72,153,0.4)' };
    if (theme === 'custom' && customConfig) {
      return {
        border: `12px solid ${customConfig.bezelColor}`,
        boxShadow: `0 0 100px ${customConfig.accentColor}60`,
      };
    }
    return { border: '4px solid #222', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' };
  };

  const getThemeIcon = (t: BezelTheme) => {
    switch (t) {
      case 'christmas':
        return <Gift className="text-red-400" />;
      case 'frost':
        return <Snowflake className="text-cyan-400" />;
      case 'gold':
        return <Zap className="text-yellow-400" />;
      case 'candy':
        return <Palette className="text-pink-400" />;
      default:
        return <Monitor className="text-slate-400" />;
    }
  };

  // Calculate Bezel Texture Styles
  const customBezelStyle = React.useMemo(() => {
    if (theme !== 'custom' || !customConfig?.bezelTexture || customConfig.bezelTexture === 'none') {
      return null;
    }
    return {
      borderImageSource: customConfig.bezelTexture.startsWith('url')
        ? customConfig.bezelTexture
        : 'none',
      borderImageSlice: 1,
      background: customConfig.bezelTexture.includes('gradient')
        ? `border-box ${customConfig.bezelTexture}`
        : 'none',
      maskImage: 'linear-gradient(black, black), linear-gradient(black, black)',
      maskClip: 'content-box, border-box',
      maskComposite: 'exclude',
      WebkitMaskComposite: 'xor',
    } as React.CSSProperties;
  }, [theme, customConfig]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-xl p-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-full max-w-6xl h-[85vh] bg-[#050508] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-8 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/5">
              {getThemeIcon(theme)}
            </div>
            <div>
              <div className="text-sm font-black text-white uppercase tracking-[0.2em]">
                Opening_Shot_Preview
              </div>
              <div className="text-[9px] font-mono text-slate-400 uppercase">
                Rendering Theme: {theme === 'custom' ? customConfig?.name : theme}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all pointer-events-auto"
          >
            <X size={18} />
          </button>
        </div>

        {/* --- STATIC RENDER ENGINE --- */}
        <div className="flex-1 relative flex items-center justify-center bg-[#020205] overflow-hidden">
          {/* Background Atmospherics */}
          <AuroraBorealis theme={theme} />
          <YuleFireplace theme={theme} config={customConfig} />

          {/* Dynamic theme-specific bezel styling with computed border and boxShadow */}
          <div
            className="relative aspect-video w-[80%] bg-black rounded-xl overflow-hidden z-10 transition-all duration-500"
            style={getBezelStyles()}
          >
            {/* Custom Bezel Texture Overlay */}
            {customBezelStyle && (
              <div
                className="absolute inset-0 z-[60] pointer-events-none border-[12px] border-transparent rounded-xl"
                style={customBezelStyle}
              />
            )}

            {firstImage ? (
              <img src={firstImage.url} className="w-full h-full object-cover" alt="Opening Shot" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#111]">
                <Film size={48} className="text-slate-700 mb-4" />
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                  No Media in Reel
                </span>
              </div>
            )}

            {/* Overlays (Static where possible, mostly decorative) */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              <DigitalFrost active={true} />
              {firstImage && <NeuralSentimentScanner theme={theme} asset={firstImage} />}
              <PolarTelemetry theme={theme} />
              <GiftUnboxOverlay theme={theme} assetId={firstImage?.id} />

              {/* Decorations */}
              <TreeDecorations theme={theme} />
              <BlizzardProtocol
                theme={theme}
                density={playback.snowDensity}
                config={customConfig}
              />
              <ChimneyVents theme={theme} config={customConfig} />
              {/* Static Snow Globe placeholder since interactive requires drag */}
              {theme === 'christmas' && (
                <div className="absolute bottom-12 left-12 opacity-80 scale-90 grayscale-[0.3]">
                  <div className="w-40 h-40 rounded-full border-2 border-white/30 bg-white/5 backdrop-blur-sm" />
                </div>
              )}
            </div>

            {/* Bezel Decorations */}
            <div className="absolute inset-0 z-30 pointer-events-none overflow-visible">
              <FestiveStringLights theme={theme} />
              <IcicleFormation theme={theme} config={customConfig} />
            </div>
          </div>

          {/* Outer Bezel Decor */}
          <div className="absolute inset-0 pointer-events-none z-40">
            {theme === 'christmas' && (
              <>
                {/* Simulated Bezel Glitters */}
                <div className="absolute top-[10%] bottom-[10%] left-[10%] w-[10px] bg-gradient-to-b from-transparent via-yellow-500/20 to-transparent" />
                <div className="absolute top-[10%] bottom-[10%] right-[10%] w-[10px] bg-gradient-to-b from-transparent via-yellow-500/20 to-transparent" />
              </>
            )}
            <BezelGarland theme={theme} orientation="horizontal" />
          </div>
        </div>

        {/* Footer Controls */}
        <div className="h-16 bg-[#0a0a0a] border-t border-white/10 flex items-center justify-center gap-4 px-8">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            Preview Mode // Animations may differ in realtime playback
          </span>
        </div>
      </div>
    </div>
  );
};

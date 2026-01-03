import React from 'react';
import { Palette, Upload } from 'lucide-react';
import { ImageAsset } from '../../types';

interface StyleTabProps {
  image: ImageAsset;
  prompt: string;
  setPrompt: (prompt: string) => void;
  styleReference: string | null;
  styleMime: string | null;
  isProcessing: boolean;
  onStyleUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onApplyStyle: () => void;
  availableImages: ImageAsset[];
  onSelectCanvasStyle: (img: ImageAsset) => void;
}

const STYLE_PRESETS = [
  { name: 'Cinematic', prompt: 'Apply cinematic color grading with dramatic lighting' },
  { name: 'Vintage Film', prompt: 'Apply vintage film aesthetic with grain and warm tones' },
  { name: 'Noir', prompt: 'Convert to high contrast black and white noir style' },
  { name: 'Anime', prompt: 'Transform into anime/manga art style' },
  { name: 'Oil Painting', prompt: 'Transform into classic oil painting style' },
  { name: 'Watercolor', prompt: 'Apply soft watercolor painting effect' },
];

export const StyleTab: React.FC<StyleTabProps> = ({
  prompt,
  setPrompt,
  styleReference,
  isProcessing,
  onStyleUpload,
  onApplyStyle,
  availableImages,
  onSelectCanvasStyle,
}) => {
  return (
    <div className="space-y-3">
      <p className="text-[10px] text-gray-400 uppercase tracking-widest">
        Style Transfer & Presets
      </p>

      {/* Style Reference Upload */}
      <div className="space-y-2">
        <span className="text-[10px] text-gray-500">Reference Image</span>
        <div className="flex gap-2">
          <label className="flex-1 py-2 px-3 bg-black/50 border border-white/10 rounded-lg text-[11px] text-gray-400 cursor-pointer hover:border-purple-500/30 transition-colors flex items-center justify-center gap-2">
            <Upload size={12} />
            {styleReference ? 'Reference loaded' : 'Upload reference'}
            <input type="file" accept="image/*" onChange={onStyleUpload} className="hidden" />
          </label>
        </div>

        {availableImages.length > 0 && (
          <div className="mt-2">
            <p className="text-[9px] text-gray-500 mb-1">Or select from canvas:</p>
            <div className="flex gap-1 flex-wrap max-h-16 overflow-y-auto">
              {availableImages.slice(0, 6).map(img => (
                <button
                  key={img.id}
                  onClick={() => onSelectCanvasStyle(img)}
                  className="w-10 h-10 rounded-md border border-white/10 overflow-hidden hover:border-purple-500/50 transition-colors"
                  title={`Use ${img.id} as style reference`}
                >
                  <div className="w-full h-full bg-gray-800" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Style Presets */}
      <div className="grid grid-cols-2 gap-1.5">
        {STYLE_PRESETS.map(preset => (
          <button
            key={preset.name}
            onClick={() => setPrompt(preset.prompt)}
            className={`py-1.5 px-2 rounded-lg text-[10px] font-medium transition-all ${
              prompt === preset.prompt
                ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Custom Prompt */}
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Or describe a custom style..."
        className="w-full h-16 bg-black/50 border border-white/10 rounded-lg p-2 text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
        disabled={isProcessing}
        aria-label="Style prompt"
      />

      <button
        onClick={onApplyStyle}
        disabled={!prompt.trim() || isProcessing}
        className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
      >
        <Palette size={16} />
        {isProcessing ? 'Applying...' : 'Apply Style'}
      </button>
    </div>
  );
};

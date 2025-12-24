import React from 'react';
import { Wand2, RefreshCw } from 'lucide-react';
import { ImageAsset } from '../../types';

interface ForgeTabProps {
  image: ImageAsset;
  prompt: string;
  setPrompt: (prompt: string) => void;
  isProcessing: boolean;
  onEdit: () => void;
  onRefine: () => void;
}

export const ForgeTab: React.FC<ForgeTabProps> = ({
  image,
  prompt,
  setPrompt,
  isProcessing,
  onEdit,
  onRefine,
}) => {
  return (
    <div className="space-y-3">
      <p className="text-[10px] text-gray-400 uppercase tracking-widest">
        Describe your vision for this image
      </p>
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., 'Make the colors more vibrant and add a sunset glow'"
          className="w-full h-24 bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none"
          disabled={isProcessing}
          aria-label="Edit prompt"
        />
        <button
          onClick={onRefine}
          disabled={!prompt.trim() || isProcessing}
          className="absolute bottom-2 right-2 p-1.5 bg-purple-500/30 hover:bg-purple-500/50 rounded-md text-purple-300 disabled:opacity-30 transition-colors"
          title="Refine prompt with AI"
        >
          <RefreshCw size={14} />
        </button>
      </div>
      <button
        onClick={onEdit}
        disabled={!prompt.trim() || isProcessing}
        className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-600 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
      >
        <Wand2 size={16} />
        {isProcessing ? 'Processing...' : 'Apply Edit'}
      </button>

      {image.tags && image.tags.length > 0 && (
        <div className="pt-2 border-t border-white/5">
          <p className="text-[9px] text-gray-500 uppercase mb-1.5">
            Detected Tags
          </p>
          <div className="flex flex-wrap gap-1">
            {image.tags.slice(0, 8).map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                className="px-2 py-0.5 bg-white/5 rounded-full text-[10px] text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

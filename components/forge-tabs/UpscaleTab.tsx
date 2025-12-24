import React from 'react';
import { Zap } from 'lucide-react';

interface UpscaleTabProps {
  isProcessing: boolean;
  creativity: number;
  setCreativity: (value: number) => void;
  onUpscale: () => void;
}

export const UpscaleTab: React.FC<UpscaleTabProps> = ({
  isProcessing,
  creativity,
  setCreativity,
  onUpscale,
}) => {
  return (
    <div className="space-y-4">
      <p className="text-[10px] text-gray-400 uppercase tracking-widest">
        Enhance Resolution & Quality
      </p>

      <div className="space-y-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400">Creativity</span>
          <span className="text-[10px] text-cyan-400 font-mono">
            {creativity}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={creativity}
          onChange={(e) => setCreativity(parseInt(e.target.value))}
          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
          aria-label="Creativity level"
        />
        <p className="text-[9px] text-gray-500">
          Higher creativity allows AI to add more detail but may deviate from
          the original.
        </p>
      </div>

      <div className="space-y-2 py-2 border-t border-white/5">
        <p className="text-[10px] text-gray-500">Output will be:</p>
        <ul className="text-[10px] text-gray-400 space-y-1 pl-3">
          <li>• 2x resolution increase</li>
          <li>• Enhanced sharpness & detail</li>
          <li>• Noise reduction</li>
          <li>• Color optimization</li>
        </ul>
      </div>

      <button
        onClick={onUpscale}
        disabled={isProcessing}
        className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:from-gray-600 disabled:to-gray-600 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
      >
        <Zap size={16} />
        {isProcessing ? 'Upscaling...' : 'Upscale Image'}
      </button>
    </div>
  );
};

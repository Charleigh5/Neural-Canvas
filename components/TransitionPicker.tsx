import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Zap,
  Layers,
  Grid3X3,
  Wind,
  Sun,
  Scissors,
  Move,
  Focus,
  Hexagon,
  Blend,
} from 'lucide-react';

export type TransitionType =
  | 'fade'
  | 'slide'
  | 'cut'
  | 'dissolve'
  | 'liquid'
  | 'glitch'
  | 'pixelate'
  | 'swirl'
  | 'flash'
  | 'zoom-blur'
  | 'kaleido';

interface TransitionPickerProps {
  value: TransitionType;
  onChange: (type: TransitionType) => void;
  compact?: boolean;
}

const TRANSITIONS: {
  type: TransitionType;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    type: 'fade',
    label: 'Fade',
    icon: <Blend size={16} />,
    description: 'Smooth opacity crossfade',
  },
  { type: 'slide', label: 'Slide', icon: <Move size={16} />, description: 'Horizontal slide wipe' },
  { type: 'cut', label: 'Cut', icon: <Scissors size={16} />, description: 'Instant hard cut' },
  {
    type: 'dissolve',
    label: 'Dissolve',
    icon: <Sparkles size={16} />,
    description: 'Pixel noise dissolve',
  },
  {
    type: 'liquid',
    label: 'Liquid',
    icon: <Wind size={16} />,
    description: 'Wavy distortion wipe',
  },
  { type: 'glitch', label: 'Glitch', icon: <Zap size={16} />, description: 'Digital artifacts' },
  {
    type: 'pixelate',
    label: 'Pixelate',
    icon: <Grid3X3 size={16} />,
    description: 'Mosaic transition',
  },
  { type: 'swirl', label: 'Swirl', icon: <Layers size={16} />, description: 'Spiral distortion' },
  { type: 'flash', label: 'Flash', icon: <Sun size={16} />, description: 'Bright flash cut' },
  {
    type: 'zoom-blur',
    label: 'Zoom Blur',
    icon: <Focus size={16} />,
    description: 'Radial motion blur',
  },
  {
    type: 'kaleido',
    label: 'Kaleido',
    icon: <Hexagon size={16} />,
    description: 'Kaleidoscope fractal',
  },
];

export const TransitionPicker: React.FC<TransitionPickerProps> = ({
  value,
  onChange,
  compact = false,
}) => {
  if (compact) {
    return (
      <select
        value={value}
        onChange={e => onChange(e.target.value as TransitionType)}
        className="bg-black/60 border border-white/20 rounded px-2 py-1 text-xs text-white/80"
        aria-label="Transition type"
      >
        {TRANSITIONS.map(t => (
          <option key={t.type} value={t.type}>
            {t.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-1 p-2">
      {TRANSITIONS.map(t => (
        <motion.button
          key={t.type}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(t.type)}
          className={`flex flex-col items-center justify-center p-2 rounded-md border transition-all ${
            value === t.type
              ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300'
              : 'bg-black/40 border-white/10 text-white/60 hover:border-white/30 hover:text-white/80'
          }`}
          title={t.description}
        >
          {t.icon}
          <span className="text-[10px] mt-1 truncate">{t.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default TransitionPicker;

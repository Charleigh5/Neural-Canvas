import { ImageAsset } from '../../types';
import {
  Snowflake,
  Stars,
  Sparkles,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Focus,
  Zap,
  Palette,
  PenTool,
  Ghost,
  Sun,
  Box,
  Grid,
} from 'lucide-react';

// Atmosphere presets for holiday/FX effects
export const ATMOSPHERE_PRESETS = [
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
] as const;

// Camera angle presets
export const CAMERA_ANGLE_PRESETS = [
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
] as const;

// Style transfer presets
export const STYLE_PRESETS = [
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
] as const;

// Tab type definition
export type ForgeTabType =
  | 'forge'
  | 'style'
  | 'inpaint'
  | 'prop'
  | 'upscale'
  | 'atmosphere'
  | 'frame'
  | 'backdrop'
  | 'camera';

// Props interface for the main Forge component
export interface FloatingNanoForgeProps {
  image: ImageAsset;
  onClose: () => void;
  initialTab?: ForgeTabType;
  anchorPosition?: { x: number; y: number };
}

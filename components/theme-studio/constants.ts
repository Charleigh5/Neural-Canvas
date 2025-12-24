import { ThemeConfig } from '../../types';

// Neural Ingredients for AI prompt building
export const NEURAL_INGREDIENTS = {
  Mood: ['Cyberpunk', 'Ethereal', 'Rustic', 'Noir', 'Sci-Fi', 'Minimalist'],
  Palette: ['Neon', 'Pastel', 'Gold/Black', 'Crimson', 'Ice', 'Obsidian'],
  FX: ['Blizzard', 'Rain', 'Embers', 'Glitter', 'Fog', 'Stardust'],
} as const;

// One-click holiday theme presets
export const ONE_CLICK_PRESETS = [
  {
    name: 'Cyberpunk Santa',
    prompt:
      'Cyberpunk Christmas: Neon red and green lights, holographic snowflakes, dark metallic bezel, synthwave holiday audio.',
  },
  {
    name: 'Cozy Cabin',
    prompt:
      'Rustic Cabin: Wood texture bezel, warm ember overlay, soft acoustic audio, cozy atmosphere.',
  },
  {
    name: 'Frozen Kingdom',
    prompt:
      'Ice Queen: Diamond texture bezel, intense blizzard overlay, magical chime audio, cool blue accents.',
  },
] as const;

// Bezel texture options
export const BEZEL_TEXTURES = [
  { id: 'none', name: 'Matte Finish' },
  {
    id: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")',
    name: 'Carbon Fiber',
  },
  {
    id: 'url("https://www.transparenttextures.com/patterns/wood-pattern.png")',
    name: 'Dark Wood',
  },
  {
    id: 'url("https://www.transparenttextures.com/patterns/brushed-alum.png")',
    name: 'Brushed Metal',
  },
  { id: 'url("https://www.transparenttextures.com/patterns/stardust.png")', name: 'Stardust' },
  { id: 'linear-gradient(45deg, #FFD700, #FDB931)', name: 'Gold Leaf' },
] as const;

// Default theme config for new/empty themes
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  id: 'scratch',
  name: 'Scratchpad',
  description: 'Custom Theme',
  bezelColor: '#1a1a1a',
  bezelTexture: 'none',
  overlayType: 'none',
  particleDensity: 0,
  audioAmbience: 'none',
  fontFamily: 'Inter',
  accentColor: '#6366f1',
};

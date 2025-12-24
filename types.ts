export enum AppMode {
  HOME = 'HOME',
  CANVAS = 'CANVAS',
  STUDIO = 'STUDIO',
  ASSETS = 'ASSETS',
  PLAYER = 'PLAYER',
}

export type BezelTheme = 'standard' | 'christmas' | 'frost' | 'gold' | 'candy' | 'custom';
export type PresentationMode = 'flat' | 'dutch' | 'low-angle' | 'overhead' | 'immersive';

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageAsset {
  id: string;
  url: string;
  file?: File;
  width: number;
  height: number;
  x: number;
  y: number;
  rotation?: number;
  scale: number;
  tags: string[];
  analyzed: boolean;
  timestamp: number;
  primaryTag?: string;
  mediaType?: 'image' | 'video';
  duration?: number;
  caption?: string;
  narrativeTitle?: string;
  heroBox?: number[]; // [ymin, xmin, ymax, xmax]
  subjectBox?: number[];
  focalPoint?: { x: number; y: number };
  cropData?: CropData;
  vibeScore?: number;
  visualWeightMultiplier?: number;
  pinned?: boolean;
  locked?: boolean;
  opacity?: number;

  // Visual adjustments
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  grayscale?: number;
  sepia?: number;
  invert?: number;
  hue?: number;

  // Genealogy / Graph
  isStackChild?: boolean;
  parentId?: string;
  variantType?: 'original' | 'edit' | 'prop' | 'upscale' | 'variant';

  // Transition / Playback
  transition?:
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
  kenBurns?: { start: number; end: number };

  // Style analysis
  style?: string;
  colors?: string[];
  cinematography?: {
    lighting_style?: string;
    camera_angle?: string;
    focal_intent?: string;
  };

  // Composition analysis
  composition?: {
    dominant_rule?: string;
    aestheticScore?: number;
    semanticEnergy?: number;
    tensionPoints?: Array<{ x: number; y: number }>;
    improvementAdvisory?: string;
  };
  visualWeight?: number;

  // Remix handling
  flipX?: boolean;
}

export interface PlaybackConfig {
  currentIndex: number;
  speed: number;
  isPlaying: boolean;
  mode: 'sequential' | 'smart-shuffle';
  quadMode: boolean;
  aspectRatio: '16:9' | '9:16';
  bezelThickness: number;
  bezelTheme: BezelTheme;
  snowDensity: number;
  showCaptions: boolean;
  presentationMode: PresentationMode;
  activeThemeConfig?: ThemeConfig;

  // Audio & Beat Sync
  audioSrc: string | null;
  isAudioPlaying: boolean;
  beatSyncMode: boolean;
  beatMarkers: number[]; // Timestamps in ms
}

export interface UiState {
  isSidebarOpen: boolean;
  isInspectorOpen: boolean;
  isTimelineOpen: boolean;
  isLiveActive: boolean;
  liveStatus: 'idle' | 'listening' | 'thinking' | 'speaking' | 'connecting';
  activePanel: string;
  isThemeStudioOpen: boolean;
  toast: { message: string; type: 'info' | 'success' | 'error' } | null;

  // Added fields
  showControlBar: boolean;
  showQuadView: boolean;
  showCaptions: boolean;
  presentationMode: PresentationMode;
  aspectRatio: '16:9' | '9:16';
  bezelTheme: BezelTheme;
  snowDensity: number;
}

export interface OrchestratorState {
  currentImageId: string | null;
  nextImageId: string | null;
  history: string[];
  queue: string[];
}

export interface SavedReel {
  id: string;
  name: string;
  itemIds: string[];
  createdAt: number;
  thumbnailUrl?: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  description?: string;
  bezelColor: string;
  bezelTexture: string;
  overlayType: 'none' | 'snow' | 'rain' | 'dust' | 'glitter' | 'embers';
  particleDensity: number;
  audioAmbience: 'none' | 'holiday' | 'lofi' | 'storm' | 'cinematic';
  fontFamily: string;
  accentColor: string;
}

export interface GoogleAlbum {
  id: string;
  title: string;
  productUrl: string;
  coverPhotoBaseUrl: string;
  mediaItemsCount: string;
}

export interface PhotoMetadata {
  cameraMake?: string;
  cameraModel?: string;
  focalLength?: number;
  apertureFNumber?: number;
  isoEquivalent?: number;
  exposureTime?: string;
}

export interface VideoMetadata {
  fps?: number;
  status?: 'PROCESSING' | 'READY' | 'FAILED';
}

export interface GoogleMediaItem {
  id: string;
  baseUrl: string;
  mimeType: string;
  mediaMetadata: {
    width: string;
    height: string;
    photo?: PhotoMetadata;
    video?: VideoMetadata;
  };
}

// --- EXPORT TYPES ---

export interface ExportConfig {
  format: 'webm' | 'mp4';
  resolution: '720p' | '1080p' | '4k';
  fps: number;
  bitrate: number; // in bits per second (e.g., 5000000 for 5Mbps)
}

export type ExportStatus = 'idle' | 'rendering' | 'encoding' | 'completed' | 'failed';

export interface ExportState {
  isExporting: boolean;
  status: ExportStatus;
  progress: number; // 0 to 100
  currentFrame: number;
  totalFrames: number;
  config: ExportConfig;
  error: string | null;
}

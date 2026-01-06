import React from 'react';
import {
  Play,
  Pause,
  Sparkles,
  Download,
  Save,
  FolderOpen,
  Cloud,
  Eye,
  Palette,
  Wand2,
  Loader2,
} from 'lucide-react';
import { AudioControls } from './AudioControls';

interface SequencerHeaderProps {
  reelLength: number;
  isPlaying: boolean;
  neuralTemperature: number;
  audioSrc: string | null;
  isAudioPlaying: boolean;
  beatSyncMode: boolean;
  isLibraryOpen: boolean;
  onTogglePlayback: () => void;
  onToggleLibrary: () => void;
  onOpenGooglePhotos: () => void;
  onSave: () => void;
  onExport: () => void;
  onOrchestrate: () => void;
  onOpenThemeStudio: () => void;
  onPreview: () => void;
  onPlayReel: () => void;
}

export const SequencerHeader: React.FC<SequencerHeaderProps> = ({
  reelLength,
  isPlaying,
  neuralTemperature,
  audioSrc,
  isAudioPlaying,
  beatSyncMode,
  isLibraryOpen,
  onTogglePlayback,
  onToggleLibrary,
  onOpenGooglePhotos,
  onSave,
  onExport,
  onOrchestrate,
  onOpenThemeStudio,
  onPreview,
  onPlayReel,
}) => {
  const isReelEmpty = reelLength === 0;

  return (
    <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 glass-panel shrink-0 z-20 relative">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-400 animate-pulse" />
          <span className="text-[11px] font-black text-white tracking-[0.4em] uppercase">
            Aurora_Sequencer
          </span>
        </div>

        <div className="flex items-center glass-button rounded-full p-1 px-3 gap-3 cursor-default hover:bg-white/5">
          <button
            onClick={onTogglePlayback}
            className="text-indigo-400 hover:text-white transition-colors p-1"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            data-testid="btn-playback-toggle"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <span className="text-[10px] font-mono text-slate-500 tracking-widest border-l border-white/10 pl-3">
            {reelLength} PACKETS
          </span>
        </div>

        <div className="h-6 w-px bg-white/5" />

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleLibrary}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              isLibraryOpen
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'glass-button text-slate-400 hover:text-white'
            }`}
          >
            <FolderOpen size={14} />{' '}
            <span className="text-[9px] font-black uppercase tracking-wider">Library</span>
          </button>
          <button
            onClick={onOpenGooglePhotos}
            className="flex items-center gap-2 px-3 py-1.5 glass-button text-slate-400 hover:text-white transition-all rounded-lg"
          >
            <Cloud size={14} />{' '}
            <span className="text-[9px] font-black uppercase tracking-wider">Cloud</span>
          </button>
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-3 py-1.5 glass-button text-slate-400 hover:text-white transition-all rounded-lg disabled:opacity-50"
            disabled={isReelEmpty}
          >
            <Save size={14} />{' '}
            <span className="text-[9px] font-black uppercase tracking-wider">Save</span>
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-1.5 glass-button text-slate-400 hover:text-white transition-all rounded-lg disabled:opacity-50"
            disabled={isReelEmpty}
            data-testid="btn-export"
          >
            <Download size={14} />{' '}
            <span className="text-[9px] font-black uppercase tracking-wider">Export</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <AudioControls
          audioSrc={audioSrc}
          isAudioPlaying={isAudioPlaying}
          beatSyncMode={beatSyncMode}
        />

        <button
          onClick={onOrchestrate}
          disabled={reelLength < 2 || neuralTemperature > 0}
          className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10 border border-indigo-500/30 rounded-full text-indigo-300 hover:text-white hover:border-indigo-500/50 transition-all disabled:opacity-50 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]"
        >
          {neuralTemperature > 0 ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Wand2 size={14} />
          )}
          <span className="text-[9px] font-black tracking-wider uppercase">AI Director</span>
        </button>

        <button
          onClick={onOpenThemeStudio}
          className="flex items-center gap-2 px-4 py-1.5 glass-button text-indigo-300 rounded-full transition-all"
          data-testid="btn-themes"
        >
          <Palette size={14} />
          <span className="text-[9px] font-black tracking-wider uppercase">Themes</span>
        </button>
        <button
          onClick={onPreview}
          className="flex items-center gap-2 px-4 py-1.5 glass-button text-cyan-400 rounded-full transition-all border-cyan-500/20 hover:border-cyan-500/50"
          disabled={isReelEmpty}
          data-testid="btn-preview"
        >
          <Eye size={14} />
          <span className="text-[9px] font-black tracking-wider uppercase">Preview_Opener</span>
        </button>
        <button
          onClick={onPlayReel}
          disabled={isReelEmpty}
          className={`
            text-[10px] font-black tracking-[0.2em] px-6 py-2 rounded-full transition-all uppercase shadow-[0_0_20px_rgba(79,70,229,0.3)]
            ${
              isReelEmpty
                ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5 opacity-50 shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]'
            }
          `}
          data-testid="btn-play-reel"
        >
          Initiate_Theater
        </button>
      </div>
    </div>
  );
};

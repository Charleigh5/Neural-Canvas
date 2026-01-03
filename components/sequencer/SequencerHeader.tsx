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
    <div className="h-14 border-b border-indigo-500/10 flex items-center justify-between px-8 bg-black/40 backdrop-blur-3xl shrink-0 z-20 relative">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-400 animate-pulse" />
          <span className="text-[11px] font-black text-white tracking-[0.4em] uppercase">
            Aurora_Sequencer
          </span>
        </div>

        <div className="flex items-center bg-white/5 rounded-full p-1 px-3 gap-3 border border-white/5">
          <button
            onClick={onTogglePlayback}
            className="text-indigo-400 hover:text-white transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            data-testid="btn-playback-toggle"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <span className="text-[10px] font-mono text-slate-500 tracking-widest">
            {reelLength} PACKETS
          </span>
        </div>

        <div className="h-6 w-px bg-white/10" />

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleLibrary}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              isLibraryOpen ? 'bg-indigo-600 text-white' : 'hover:bg-white/5 text-slate-400'
            }`}
          >
            <FolderOpen size={14} />{' '}
            <span className="text-[9px] font-black uppercase tracking-wider">Library</span>
          </button>
          <button
            onClick={onOpenGooglePhotos}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-slate-400 transition-all"
          >
            <Cloud size={14} />{' '}
            <span className="text-[9px] font-black uppercase tracking-wider">Cloud</span>
          </button>
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-slate-400 transition-all"
            disabled={isReelEmpty}
          >
            <Save size={14} />{' '}
            <span className="text-[9px] font-black uppercase tracking-wider">Save</span>
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-slate-400 transition-all"
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
          className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/20 border border-indigo-500/30 rounded-full text-indigo-300 hover:text-white transition-all disabled:opacity-50"
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
          className="flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 text-indigo-300 rounded-full border border-indigo-500/20 transition-all"
          data-testid="btn-themes"
        >
          <Palette size={14} />
          <span className="text-[9px] font-black tracking-wider uppercase">Themes</span>
        </button>
        <button
          onClick={onPreview}
          className="flex items-center gap-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-full border border-cyan-500/30 transition-all"
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
            text-[10px] font-black tracking-[0.2em] px-8 py-2 rounded-full transition-all uppercase shadow-[0_0_30px_rgba(79,70,229,0.3)]
            ${
              isReelEmpty
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5 opacity-50'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
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

import React from 'react';
import { Music, Play, Pause } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { AudioWaveform } from '../AudioWaveform';
import { analyzeAudio } from '../../services/audioService';

interface AudioControlsProps {
  audioSrc: string | null;
  isAudioPlaying: boolean;
  beatSyncMode: boolean;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  audioSrc,
  isAudioPlaying,
  beatSyncMode,
}) => {
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      useStore.getState().setAudioSrc(url);
      const analysis = await analyzeAudio(url);
      useStore.getState().setBeatMarkers(analysis.peaks);
      useStore.getState().addCouncilLog(`Audio Loaded: ${Math.round(analysis.bpm)} BPM`, 'success');
    }
  };

  const toggleAudioPlayback = () => {
    useStore.getState().setIsAudioPlaying(!isAudioPlaying);
  };

  const toggleBeatSync = () => {
    useStore.getState().setBeatSyncMode(!beatSyncMode);
  };

  return (
    <div className="flex items-center gap-2 bg-white/5 rounded-full p-1 border border-white/5 pr-4">
      <label
        className="cursor-pointer hover:text-indigo-400 text-slate-500 transition-colors p-1.5"
        title="Upload Audio Track"
      >
        <Music size={14} />
        <input
          type="file"
          accept="audio/*"
          className="hidden"
          aria-label="Upload Audio Track"
          onChange={handleAudioUpload}
        />
      </label>
      {audioSrc && (
        <>
          <button
            onClick={toggleAudioPlayback}
            className={isAudioPlaying ? 'text-indigo-400' : 'text-slate-500'}
            aria-label={isAudioPlaying ? 'Pause Audio' : 'Play Audio'}
            title={isAudioPlaying ? 'Pause Audio' : 'Play Audio'}
          >
            {isAudioPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <button
            onClick={toggleBeatSync}
            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
              beatSyncMode ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-indigo-400'
            }`}
          >
            Beat_Sync
          </button>
          {/* Mini Waveform */}
          <div className="w-24 h-6 opacity-50">
            <AudioWaveform
              audioSrc={audioSrc}
              height={24}
              waveColor="#818cf8"
              progressColor="#c7d2fe"
            />
          </div>
        </>
      )}
    </div>
  );
};

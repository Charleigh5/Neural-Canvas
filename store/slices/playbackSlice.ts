import { StateCreator } from 'zustand';
import { PlaybackConfig } from '../../types';

export interface PlaybackSlice {
  reel: string[];
  playback: PlaybackConfig;

  // Actions
  addToReel: (ids: string[]) => void;
  removeFromReel: (id: string) => void;
  reorderReel: (newOrder: string[]) => void;
  clearReel: () => void;
  playReel: () => void;
  togglePlayback: () => void;
  nextSlide: () => void;
  prevSlide: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setPlaybackMode: (mode: 'sequential' | 'smart-shuffle') => void;

  // Audio Actions
  setAudioSrc: (src: string | null) => void;
  setIsAudioPlaying: (isPlaying: boolean) => void;
  setBeatSyncMode: (enabled: boolean) => void;
  setBeatMarkers: (markers: number[]) => void;
}

const defaultPlayback: PlaybackConfig = {
  isPlaying: false,
  currentIndex: 0,
  speed: 5,
  mode: 'sequential',
  quadMode: false,
  aspectRatio: '16:9',
  bezelThickness: 20,
  bezelTheme: 'standard',
  snowDensity: 0,
  showCaptions: false,
  presentationMode: 'flat',

  // Audio defaults
  audioSrc: null,
  isAudioPlaying: false,
  beatSyncMode: false,
  beatMarkers: [],
};

export const createPlaybackSlice: StateCreator<PlaybackSlice, [], [], PlaybackSlice> = (
  set,
  _get
) => ({
  reel: [],
  playback: defaultPlayback,

  addToReel: ids =>
    set(state => ({
      reel: [...new Set([...state.reel, ...ids])],
    })),

  removeFromReel: id =>
    set(state => ({
      reel: state.reel.filter(rid => rid !== id),
    })),

  reorderReel: newOrder => set({ reel: newOrder }),

  clearReel: () =>
    set({
      reel: [],
      playback: { ...defaultPlayback, isPlaying: false, currentIndex: 0 },
    }),

  playReel: () =>
    set(state => ({
      playback: {
        ...state.playback,
        isPlaying: true,
        currentIndex: 0,
        // If we have audio, playing the reel should arguably start audio too,
        // but we'll let the UI handle that coordination or specific setIsAudioPlaying calls.
      },
    })),

  togglePlayback: () =>
    set(state => ({
      playback: { ...state.playback, isPlaying: !state.playback.isPlaying },
    })),

  nextSlide: () =>
    set(state => {
      const { reel, playback } = state;
      if (reel.length === 0) return state;

      let nextIndex: number;
      if (playback.mode === 'smart-shuffle') {
        nextIndex = Math.floor(Math.random() * reel.length);
      } else {
        nextIndex = (playback.currentIndex + 1) % reel.length;
      }

      return {
        playback: { ...playback, currentIndex: nextIndex },
      };
    }),

  prevSlide: () =>
    set(state => {
      const { reel, playback } = state;
      if (reel.length === 0) return state;

      const prevIndex = (playback.currentIndex - 1 + reel.length) % reel.length;

      return {
        playback: { ...playback, currentIndex: prevIndex },
      };
    }),

  setPlaybackSpeed: speed =>
    set(state => ({
      playback: { ...state.playback, speed },
    })),

  setPlaybackMode: mode =>
    set(state => ({
      playback: { ...state.playback, mode },
    })),

  setAudioSrc: src =>
    set(state => ({
      playback: { ...state.playback, audioSrc: src },
    })),

  setIsAudioPlaying: isPlaying =>
    set(state => ({
      playback: { ...state.playback, isAudioPlaying: isPlaying },
    })),

  setBeatSyncMode: enabled =>
    set(state => ({
      playback: { ...state.playback, beatSyncMode: enabled },
    })),

  setBeatMarkers: markers =>
    set(state => ({
      playback: { ...state.playback, beatMarkers: markers },
    })),
});

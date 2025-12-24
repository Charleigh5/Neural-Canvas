import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export const AudioController: React.FC = () => {
  const { playback, setIsAudioPlaying, nextSlide } = useStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastBeatIndexRef = useRef<number>(-1);

  // Initialize Audio Element
  useEffect(() => {
    if (!playback.audioSrc) return;

    // Create new audio element if source changes
    if (!audioRef.current || audioRef.current.src !== playback.audioSrc) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const audio = new Audio(playback.audioSrc);
      audio.crossOrigin = 'anonymous';
      audioRef.current = audio;

      audio.onended = () => {
        setIsAudioPlaying(false);
        if (playback.isPlaying) {
          // Determine what to do when song ends - loop or stop?
          // For now, let's stop audio playing state.
          // Optionally loop if reel is infinite?
        }
      };
    }
  }, [playback.audioSrc, setIsAudioPlaying, playback.isPlaying]); // Added playback.isPlaying to dependencies to handle hot-swaps if needed, but mainly audioSrc

  // Handle Play/Pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playback.isAudioPlaying && audio.paused) {
      audio.play().catch(e => console.error('Audio play failed', e));
    } else if (!playback.isAudioPlaying && !audio.paused) {
      audio.pause();
    }
  }, [playback.isAudioPlaying, playback.audioSrc]);

  // Sync Logic
  useEffect(() => {
    if (!playback.beatSyncMode || !playback.isAudioPlaying || playback.beatMarkers.length === 0) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const checkBeats = () => {
      if (!audioRef.current) return;

      const currentTime = audioRef.current.currentTime * 1000; // ms
      const markers = playback.beatMarkers;

      // Find the next beat that hasn't been triggered
      // We track the index of the last triggered beat

      // Optimization: search only after lastBeatIndex
      // But if we loop or seek, we need to reset.
      // For simple playback:

      // Find the highest beat index that is <= currentTime
      let currentBeatIndex = -1;
      for (let i = 0; i < markers.length; i++) {
        if (markers[i] <= currentTime) {
          currentBeatIndex = i;
        } else {
          break;
        }
      }

      if (currentBeatIndex > lastBeatIndexRef.current) {
        // We crossed a beat (or multiple)
        nextSlide();
        lastBeatIndexRef.current = currentBeatIndex;
      } else if (currentBeatIndex < lastBeatIndexRef.current) {
        // Seeked backwards
        lastBeatIndexRef.current = currentBeatIndex;
      }

      rafRef.current = requestAnimationFrame(checkBeats);
    };

    rafRef.current = requestAnimationFrame(checkBeats);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playback.beatSyncMode, playback.isAudioPlaying, playback.beatMarkers, nextSlide]);

  return null; // Invisible component
};

import React, { useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { BezelTheme, ThemeConfig } from '../../types';
import { audioService } from '../../services/audioService';

interface HolidayAudioProps {
  theme: BezelTheme;
  config?: ThemeConfig;
}

export const HolidayAudio: React.FC<HolidayAudioProps> = ({ theme, config }) => {
  const { playback } = useStore();
  const isPlaying = playback.isPlaying;
  const internalGainRef = useRef<GainNode | null>(null);

  // Determine active ambience
  const ambience = config?.audioAmbience
    ? config.audioAmbience
    : theme === 'christmas'
      ? 'holiday'
      : 'none';

  useEffect(() => {
    if (ambience === 'none') return;

    const ctx = audioService.getContext();
    const masterBus = audioService.getMasterBus();

    // Local gain for this specific theme's output
    const themeGain = ctx.createGain();
    themeGain.gain.value = 0;
    themeGain.connect(masterBus);
    internalGainRef.current = themeGain;

    const nodes: AudioNode[] = [];

    // --- AUDIO ENGINES ---

    if (ambience === 'holiday' || ambience === 'storm') {
      // 1. WIND ENGINE (Shared by Holiday/Storm)
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

      const windSource = ctx.createBufferSource();
      windSource.buffer = noiseBuffer;
      windSource.loop = true;

      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'lowpass';
      windFilter.Q.value = 5;

      const windGain = ctx.createGain();
      windGain.gain.value = ambience === 'storm' ? 0.4 : 0.15; // Louder for storm

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = ambience === 'storm' ? 0.3 : 0.15; // Faster for storm
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 300;
      lfo.connect(lfoGain);
      lfoGain.connect(windFilter.frequency);
      windFilter.frequency.value = 400;

      windSource.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(themeGain);
      lfo.start();
      windSource.start();
      nodes.push(windSource, lfo, windGain);
    }

    if (ambience === 'holiday') {
      // 2. PROCEDURAL HEARTH
      const fireTimer = setInterval(() => {
        if (ctx.state !== 'running' || !isPlaying) return;
        const now = ctx.currentTime;

        if (Math.random() > 0.94) {
          const snap = ctx.createOscillator();
          snap.type = 'triangle';
          snap.frequency.setValueAtTime(2500 + Math.random() * 4000, now);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0, now);
          g.gain.linearRampToValueAtTime(0.02, now + 0.001);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
          snap.connect(g);
          g.connect(themeGain);
          snap.start(now);
          snap.stop(now + 0.02);
        }
      }, 100);

      // 3. PENTATONIC CHIMES
      const chimeNotes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
      const chimeTimer = setInterval(() => {
        if (ctx.state !== 'running' || !isPlaying || Math.random() > 0.15) return;
        const now = ctx.currentTime;
        const freq = chimeNotes[Math.floor(Math.random() * chimeNotes.length)];

        const osc = ctx.createOscillator();
        const harm = ctx.createOscillator();
        osc.type = 'sine';
        harm.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        harm.frequency.setValueAtTime(freq * 2.01, now);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.01, now + 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + 4.0);

        osc.connect(g);
        harm.connect(g);
        g.connect(themeGain);
        osc.start(now);
        harm.start(now);
        osc.stop(now + 4.5);
        harm.stop(now + 4.5);
      }, 4000);

      // Clean up intervals on unmount
      nodes.push({ stop: () => clearInterval(fireTimer) } as any);
      nodes.push({ stop: () => clearInterval(chimeTimer) } as any);
    }

    if (ambience === 'cinematic') {
      // DEEP DRONE
      const droneOsc = ctx.createOscillator();
      droneOsc.type = 'sawtooth';
      droneOsc.frequency.value = 55; // Low A
      const droneFilter = ctx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.value = 120;
      const droneGain = ctx.createGain();
      droneGain.gain.value = 0.2;

      droneOsc.connect(droneFilter);
      droneFilter.connect(droneGain);
      droneGain.connect(themeGain);
      droneOsc.start();
      nodes.push(droneOsc);
    }

    return () => {
      nodes.forEach(n => {
        try {
          if ('stop' in n) (n as any).stop();
          else n.disconnect();
        } catch {
          // Audio nodes may already be stopped/disconnected - safe to ignore
        }
      });
      themeGain.disconnect();
    };
  }, [ambience, isPlaying]);

  useEffect(() => {
    const tg = internalGainRef.current;
    const ctx = audioService.getContext();
    if (!tg || !ctx) return;

    if (isPlaying && ambience !== 'none') {
      audioService.resume();
      tg.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2);
    } else {
      tg.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    }
  }, [isPlaying, ambience]);

  return null;
};

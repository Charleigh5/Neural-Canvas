import React, { useEffect } from 'react';
import { InfiniteCanvas } from './components/InfiniteCanvas';
import { OrbitalFrame } from './components/OrbitalFrame';
import { QuadMonitorView } from './components/QuadMonitorView';
import { HomeScreen } from './components/HomeScreen';
import { AssetsView } from './components/AssetsView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useStore } from './store/useStore';
import { AppMode } from './types';
import { AudioController } from './components/AudioController';

export default function App() {
  const { mode, playback, nextSlide } = useStore();

  // Playback Loop
  useEffect(() => {
    // If beat sync is on and audio is playing, let AudioController handle slides
    if (playback.beatSyncMode && playback.isAudioPlaying) return;

    let interval: ReturnType<typeof setInterval> | undefined;
    if (playback.isPlaying) {
      interval = setInterval(() => {
        nextSlide();
      }, playback.speed * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    playback.isPlaying,
    playback.speed,
    nextSlide,
    playback.beatSyncMode,
    playback.isAudioPlaying,
  ]);

  return (
    <ErrorBoundary>
      <div className="w-screen h-screen bg-black text-white overflow-hidden font-sans">
        <AudioController />
        <OrbitalFrame>
          {mode === AppMode.HOME && <HomeScreen />}
          {mode === AppMode.CANVAS && <InfiniteCanvas />}
          {mode === AppMode.STUDIO && <InfiniteCanvas />}
          {mode === AppMode.ASSETS && <AssetsView />}
          {mode === AppMode.PLAYER && <QuadMonitorView />}
        </OrbitalFrame>
      </div>
    </ErrorBoundary>
  );
}

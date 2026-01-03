import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface AudioWaveformProps {
  audioSrc: string;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  className?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  audioSrc,
  height = 48,
  waveColor = '#6366f1', // Indigo-500
  progressColor = '#a5b4fc', // Indigo-300
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current || !audioSrc) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const gradient = ctx?.createLinearGradient(0, 0, 0, height);
    if (gradient) {
      gradient.addColorStop(0, '#818cf8'); // Indigo-400
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.2)'); // Indigo-500 transparent
    }

    const progressGradient = ctx?.createLinearGradient(0, 0, 0, height);
    if (progressGradient) {
      progressGradient.addColorStop(0, '#c7d2fe'); // Indigo-200
      progressGradient.addColorStop(1, '#4f46e5'); // Indigo-600
    }

    wavesurferRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: gradient || waveColor,
      progressColor: progressGradient || progressColor,
      height,
      cursorColor: 'transparent',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
      interact: false, // Pure visualization
    });

    wavesurferRef.current.load(audioSrc);

    return () => {
      wavesurferRef.current?.destroy();
    };
  }, [audioSrc, height, waveColor, progressColor]);

  return <div ref={containerRef} className={className} />;
};

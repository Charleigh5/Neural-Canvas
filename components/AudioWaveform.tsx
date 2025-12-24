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

    wavesurferRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor,
      progressColor,
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

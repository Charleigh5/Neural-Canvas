import React, { useEffect, useRef } from 'react';
import AudioMotionAnalyzer from 'audiomotion-analyzer';
import { audioService } from '../services/audioService';

interface SpectralVisualizerProps {
  className?: string;
  mode?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 10;
  height?: number;
}

export const SpectralVisualizer: React.FC<SpectralVisualizerProps> = ({ 
  className = '', 
  mode = 2, // Octave bands
  height = 120 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const analyzerRef = useRef<AudioMotionAnalyzer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize AudioMotion
    const analyzer = new AudioMotionAnalyzer(containerRef.current, {
      source: audioService.getMasterBus(),
      mode: mode,
      barSpace: 0.5,
      gradient: 'prism',
      showScaleX: false,
      showScaleY: false,
      showFPS: false,
      overlay: true,
      bgAlpha: 0, // Transparent background
      alphaBars: true,
      lineWidth: 2,
      useCanvas: true,
    });

    // Custom gradient to match Neural Canvas aesthetic
    analyzer.registerGradient('neural', {
      colorStops: [
        { pos: 0, color: '#6366f1' }, // Indigo-500
        { pos: 0.5, color: '#8b5cf6' }, // Violet-500
        { pos: 1, color: '#ec4899' }, // Pink-500
      ]
    });
    analyzer.setOptions({ gradient: 'neural' });

    analyzerRef.current = analyzer;

    return () => {
      if (analyzerRef.current) {
        analyzerRef.current.destroy();
      }
    };
  }, [mode]);

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full overflow-hidden ${className}`} 
      style={{ height }} 
    />
  );
};

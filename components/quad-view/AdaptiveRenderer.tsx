/**
 * AdaptiveRenderer - Intelligently switches between WebGL transitions and ParallaxImage
 *
 * Uses ParallaxImage when:
 * - Asset has a depth map
 * - User hasn't specified a transition (defaults to parallax)
 *
 * Falls back to TransitionRenderer for all other cases
 */

import React from 'react';
import { TransitionRenderer } from './TransitionRenderer';
import { ParallaxImage } from '../ParallaxImage';
import { ImageAsset } from '../../types';

interface AdaptiveRendererProps {
  prevAsset: ImageAsset | undefined;
  currAsset: ImageAsset;
  progress: number;
  type?:
    | 'fade'
    | 'slide'
    | 'cut'
    | 'dissolve'
    | 'liquid'
    | 'glitch'
    | 'pixelate'
    | 'swirl'
    | 'flash'
    | 'zoom-blur'
    | 'kaleido'
    | 'parallax'; // New parallax transition type
  kenBurns?: { start: number; end: number };
  currFocalPoint?: { x: number; y: number };
  prevFocalPoint?: { x: number; y: number };
  duration?: number;
}

export const AdaptiveRenderer: React.FC<AdaptiveRendererProps> = props => {
  const { currAsset, type, kenBurns = { start: 1.0, end: 1.15 } } = props;

  // Determine if we should use parallax rendering
  const shouldUseParallax = type === 'parallax' || (currAsset.depthMapUrl && !type);

  if (shouldUseParallax && currAsset.depthMapUrl) {
    // Use ParallaxImage for depth-based 3D effect
    return (
      <div className="w-full h-full relative">
        <ParallaxImage
          imageUrl={currAsset.url}
          depthMapUrl={currAsset.depthMapUrl}
          intensity={0.6}
          animationMode="auto"
          kenBurns={kenBurns}
          animationDuration={props.duration || 5}
          className="absolute inset-0"
          alt={currAsset.caption || currAsset.narrativeTitle || 'Image'}
        />
      </div>
    );
  }

  // Fallback to standard WebGL transition renderer
  // Filter out 'parallax' type as TransitionRenderer doesn't support it
  const transitionType = type === 'parallax' ? 'dissolve' : type;

  return <TransitionRenderer {...props} type={transitionType} />;
};

export default AdaptiveRenderer;

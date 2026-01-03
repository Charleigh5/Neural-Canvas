/**
 * ParallaxImage - 3D parallax effect component using depth maps
 *
 * Uses a depth map to create a layered parallax effect where
 * foreground elements move more than background elements.
 * Falls back to standard image display if no depth map is available.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface ParallaxImageProps {
  /** Source URL of the main image */
  imageUrl: string;
  /** Source URL of the depth map (grayscale) */
  depthMapUrl?: string;
  /** Parallax effect intensity (0-1) */
  intensity?: number;
  /** Animation mode for automatic Ken Burns effect */
  animationMode?: 'mouse' | 'auto' | 'both' | 'none';
  /** Ken Burns animation duration in seconds */
  animationDuration?: number;
  /** Additional CSS class names */
  className?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Ken Burns zoom range */
  kenBurns?: { start: number; end: number };
}

const NUM_LAYERS = 5;

export const ParallaxImage: React.FC<ParallaxImageProps> = ({
  imageUrl,
  depthMapUrl,
  intensity = 0.5,
  animationMode = 'both',
  animationDuration = 10,
  className = '',
  alt = '',
  kenBurns,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [autoOffset, setAutoOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const animationRef = useRef<number | null>(null);

  // Ken Burns auto-animation
  useEffect(() => {
    if (animationMode === 'none' || animationMode === 'mouse') return;
    if (!isLoaded) return;

    const startTime = Date.now();
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = (elapsed % animationDuration) / animationDuration;

      // Smooth sine wave for pan
      const x = Math.sin(progress * Math.PI * 2) * 0.3;
      const y = Math.cos(progress * Math.PI * 2 * 0.7) * 0.2;
      setAutoOffset({ x, y });

      // Ken Burns zoom
      if (kenBurns) {
        const zoomProgress = (Math.sin(progress * Math.PI * 2) + 1) / 2;
        const zoomScale = kenBurns.start + (kenBurns.end - kenBurns.start) * zoomProgress;
        setScale(zoomScale);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animationMode, animationDuration, isLoaded, kenBurns]);

  // Mouse tracking for parallax
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (animationMode === 'none' || animationMode === 'auto') return;
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setMouseOffset({ x, y });
    },
    [animationMode]
  );

  const handleMouseLeave = useCallback(() => {
    setMouseOffset({ x: 0, y: 0 });
  }, []);

  // Combine offsets
  const totalOffset = {
    x: (mouseOffset.x + autoOffset.x) * intensity * 20,
    y: (mouseOffset.y + autoOffset.y) * intensity * 20,
  };

  // If no depth map, render standard image with Ken Burns
  if (!depthMapUrl) {
    return (
      <motion.div
        ref={containerRef}
        className={`relative overflow-hidden ${className}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <motion.img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover"
          onLoad={() => setIsLoaded(true)}
          animate={{
            scale,
            x: totalOffset.x,
            y: totalOffset.y,
          }}
          transition={{ type: 'spring', stiffness: 100, damping: 30 }}
        />
      </motion.div>
    );
  }

  // Render layered parallax effect
  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Depth-based parallax layers */}
      {Array.from({ length: NUM_LAYERS }).map((_, i) => {
        const layerDepth = i / (NUM_LAYERS - 1);
        const layerIntensity = 1 - layerDepth; // Foreground moves more
        const layerOffset = {
          x: totalOffset.x * layerIntensity,
          y: totalOffset.y * layerIntensity,
        };

        return (
          <motion.div
            key={i}
            className="absolute inset-0"
            // Dynamic z-index required for layer composition
            style={{ zIndex: NUM_LAYERS - i }}
            animate={{
              x: layerOffset.x,
              y: layerOffset.y,
              scale,
            }}
            transition={{ type: 'spring', stiffness: 150, damping: 25 }}
          >
            {/* Inline styles required: maskImage, WebkitMaskImage, and dynamic filter not supported by Tailwind */}
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                // Use depth map as mask - lighter areas (closer) show on higher layers
                maskImage: `url(${depthMapUrl})`,
                WebkitMaskImage: `url(${depthMapUrl})`,
                maskSize: 'cover',
                WebkitMaskSize: 'cover',
                // Adjust brightness threshold for each layer
                filter: `brightness(${1 + (i - NUM_LAYERS / 2) * 0.1})`,
                opacity: i === 0 ? 1 : 0.9,
              }}
            />
          </motion.div>
        );
      })}

      {/* Base layer (always visible) */}
      <motion.img
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-cover"
        onLoad={() => setIsLoaded(true)}
        style={{ zIndex: 0 }}
        animate={{
          scale,
        }}
        transition={{ type: 'spring', stiffness: 100, damping: 30 }}
      />
    </div>
  );
};

export default ParallaxImage;

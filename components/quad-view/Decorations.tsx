import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { Star, Sparkles } from 'lucide-react';
import { BezelTheme } from '../../types';
import './Decorations.css';

// Note: This file uses inline styles for runtime-calculated animation properties
// (delays, durations, positions) that are randomized per render.

// Sub-component for Festive Bulbs (extracted to allow hooks usage)
const FestiveBulb = ({
  i,
  y,
  colors,
  glows,
  idx,
}: {
  i: number;
  y: number;
  colors: string[];
  glows: string[];
  idx: number;
}) => {
  const bulbRef = React.useRef<HTMLDivElement>(null);
  const innerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (bulbRef.current) {
      bulbRef.current.style.setProperty('--y-offset', `${y - 12}px`);
      bulbRef.current.style.setProperty('--delay', `${Math.random() * 2}s`);
      bulbRef.current.style.setProperty('--duration', `${3 + Math.random()}s`);
    }
    if (innerRef.current) {
      innerRef.current.style.setProperty('--glow', glows[idx]);
      innerRef.current.style.setProperty('--pulse-duration', `${0.8 + Math.random() * 1.5}s`);
    }
  }, [y, glows, idx]);

  return (
    <div
      key={i}
      ref={bulbRef}
      className="relative flex flex-col items-center animate-swing origin-top festive-bulb"
    >
      <div className="w-3 h-4 bg-gray-800 rounded-sm z-10" />
      <div
        ref={innerRef}
        className={`w-4 h-6 rounded-full shadow-lg ${colors[idx]} animate-pulse festive-bulb-inner`}
      />
    </div>
  );
};

// 1. Decoration: Festive String Lights
export const FestiveStringLights = ({ theme }: { theme: BezelTheme }) => {
  if (theme !== 'christmas') return null;
  const bulbs = 20;
  const colors = ['bg-red-600', 'bg-green-600', 'bg-yellow-500', 'bg-blue-600'];
  const glows = ['red', '#16a34a', '#eab308', '#2563eb'];

  return (
    <div className="absolute top-0 left-0 w-full h-32 z-50 pointer-events-none overflow-hidden">
      <svg className="absolute top-0 left-0 w-full h-full" preserveAspectRatio="none">
        <path
          d="M0,0 Q500,70 1000,0"
          fill="none"
          stroke="#222"
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="absolute top-0 left-0 w-full h-full flex justify-between items-start px-6">
        {Array.from({ length: bulbs }).map((_, i) => {
          const t = (i + 0.5) / bulbs;
          const y = 4 * 70 * t * (1 - t);
          const idx = i % colors.length;
          return <FestiveBulb key={i} i={i} y={y} colors={colors} glows={glows} idx={idx} />;
        })}
      </div>
    </div>
  );
};

// Sub-component for Garland Lights (extracted to allow hooks usage)
interface GarlandLightProps {
  i: number;
  theme: BezelTheme;
  isVertical: boolean;
  color: string;
  variant: number;
  posStyle: React.CSSProperties;
  baseRotation: number;
}

const GarlandLight = ({
  i,
  theme,
  isVertical,
  color,
  variant,
  posStyle,
  baseRotation,
}: GarlandLightProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const lightRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (containerRef.current) {
      Object.entries(posStyle).forEach(([key, value]) => {
        containerRef.current?.style.setProperty(key, String(value));
      });
    }
    if (lightRef.current) {
      lightRef.current.style.setProperty('--color', color);
      lightRef.current.style.setProperty('--rotation', `${baseRotation}deg`);
    }
  }, [posStyle, color, baseRotation]);

  const animateProps =
    theme === 'christmas'
      ? {
          opacity:
            variant === 0
              ? [0.6, 1, 0.6]
              : variant === 1
                ? [1, 0.3, 1, 0.8, 0.2, 1]
                : variant === 2
                  ? [0.8, 0.95, 0.8]
                  : [0.7, 1, 0.7],
          scale:
            variant === 0
              ? [1, 1.2, 1]
              : variant === 1
                ? [1.1, 0.8, 1.1]
                : variant === 2
                  ? [1, 1.1, 1]
                  : [1, 1.15, 1],
          filter:
            variant === 2
              ? [
                  `brightness(1) hue-rotate(0deg)`,
                  `brightness(1.2) hue-rotate(45deg)`,
                  `brightness(1) hue-rotate(0deg)`,
                ]
              : variant === 1
                ? [
                    `brightness(1.5) drop-shadow(0 0 5px ${color})`,
                    `brightness(1) drop-shadow(0 0 1px ${color})`,
                    `brightness(1.5) drop-shadow(0 0 5px ${color})`,
                  ]
                : variant === 3
                  ? [
                      `brightness(1) drop-shadow(0 0 2px ${color})`,
                      `brightness(1.5) drop-shadow(0 0 8px ${color})`,
                      `brightness(1) drop-shadow(0 0 2px ${color})`,
                    ]
                  : [
                      `brightness(1) drop-shadow(0 0 2px ${color})`,
                      `brightness(1.1) drop-shadow(0 0 4px ${color})`,
                      `brightness(1) drop-shadow(0 0 2px ${color})`,
                    ],
        }
      : {
          opacity: [0.6, 1, 0.6],
          scale: [0.9, 1.4, 0.9],
        };

  const swingProps =
    !isVertical && theme === 'christmas'
      ? {
          rotate: [baseRotation - 3, baseRotation + 3, baseRotation - 3],
          y: [0, 2, 0],
        }
      : {
          rotate: [baseRotation - 2, baseRotation + 2, baseRotation - 2],
        };

  return (
    <div ref={containerRef} className="absolute garland-light-container">
      {!isVertical && theme === 'christmas' && (
        <div className="absolute -top-3 left-1/2 w-[1px] bg-green-900/90 -translate-x-1/2 origin-top garland-light-string" />
      )}
      <motion.div
        ref={lightRef}
        className="relative garland-light-bulb w-[10px] h-[14px] origin-top"
        animate={{ ...animateProps, ...swingProps }}
        transition={{
          duration: 1.5 + (i % 3) + Math.random(),
          repeat: Infinity,
          delay: i * 0.05,
          ease: 'easeInOut',
        }}
      >
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-green-900 rounded-sm shadow-sm" />
        <div className="absolute top-1 left-1 w-1 h-1 bg-white/50 opacity-80 rounded-full" />
      </motion.div>
    </div>
  );
};

// 2. Bezel: Garland Lights
export const BezelGarland = ({
  theme,
  orientation,
}: {
  theme: BezelTheme;
  orientation: 'vertical' | 'horizontal';
}) => {
  if (theme !== 'candy' && theme !== 'christmas') return null;

  const isVertical = orientation === 'vertical';
  const count = isVertical ? 32 : 45;
  const colors = ['#ef4444', '#22c55e', '#eab308', '#3b82f6', '#ec4899', '#8b5cf6'];

  return (
    <div className="absolute inset-0 z-40 pointer-events-none">
      {theme === 'christmas' && (
        <svg className="absolute inset-0 w-full h-full overflow-visible opacity-90 filter drop-shadow-md">
          {isVertical ? (
            <path
              d="M 50,0 Q 90,15 50,30 T 50,60 T 50,90 T 50,120"
              fill="none"
              stroke="#14532d"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M -5,40 Q 50,95 105,40"
              fill="none"
              stroke="#14532d"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
            />
          )}
        </svg>
      )}

      {Array.from({ length: count }).map((_, i) => {
        const t = i / (count - 1);
        const color = colors[i % colors.length];
        const variant = i % 4;

        let posStyle: React.CSSProperties = {};
        let baseRotation = 0;

        if (isVertical) {
          const y = t * 100;
          const x = 50 + Math.sin(t * Math.PI * 6.5) * 35;
          posStyle = { top: `${y}%`, left: `${x}%` };
          baseRotation = Math.cos(t * Math.PI * 6.5) * 25;
        } else {
          const x = t * 106 - 3;
          const yBase = 40;
          const yDeep = 95;
          const y = yBase + (yDeep - yBase) * (1 - Math.pow(2 * t - 1, 2));
          posStyle = { left: `${x}%`, top: `${y}%` };
        }

        return (
          <GarlandLight
            key={i}
            i={i}
            theme={theme}
            isVertical={isVertical}
            color={color}
            variant={variant}
            posStyle={posStyle}
            baseRotation={baseRotation}
          />
        );
      })}
    </div>
  );
};

// 3. Texture: Bezel Glitter Overlay
export const BezelGlitter = ({ theme }: { theme: BezelTheme }) => {
  if (theme !== 'christmas') return null;
  return (
    <div className="absolute inset-0 z-30 pointer-events-none mix-blend-screen opacity-70 animate-glitter" />
  );
};

// 4. Decoration: High-Refinement Festive Tree (Refined Twinkling)
export const TreeDecorations = ({ theme }: { theme: BezelTheme }) => {
  // All hooks must be called unconditionally before any early returns
  const ornaments = useMemo(
    () => [
      { top: '15%', left: '50%', color: '#ef4444', size: 6, behavior: 'sparkle', delay: 0 },
      { top: '35%', left: '40%', color: '#3b82f6', size: 5, behavior: 'twinkle', delay: 0.4 },
      { top: '38%', left: '60%', color: '#fbbf24', size: 5, behavior: 'pulse', delay: 0.2 },
      { top: '55%', left: '30%', color: '#ec4899', size: 7, behavior: 'sparkle', delay: 0.6 },
      { top: '58%', left: '50%', color: '#10b981', size: 6, behavior: 'glow', delay: 0.1 },
      { top: '62%', left: '70%', color: '#8b5cf6', size: 7, behavior: 'twinkle', delay: 0.3 },
      { top: '75%', left: '25%', color: '#f97316', size: 8, behavior: 'sparkle', delay: 0.8 },
      { top: '78%', left: '45%', color: '#f43f5e', size: 6, behavior: 'pulse', delay: 0.5 },
      { top: '82%', left: '60%', color: '#ffffff', size: 7, behavior: 'glow', delay: 0.2 },
      { top: '80%', left: '75%', color: '#eab308', size: 8, behavior: 'twinkle', delay: 0.7 },
    ],
    []
  );

  if (theme !== 'christmas') return null;

  const getOrnamentAnimation = (orn: (typeof ornaments)[0], i: number) => {
    const { behavior, color } = orn;

    const baseAnimate = {
      scale: [1, 1.2, 1],
      opacity: [0.7, 1, 0.7],
    };

    if (behavior === 'sparkle') {
      return {
        ...baseAnimate,
        opacity: [0.4, 1, 0.2, 1, 0.4],
        scale: [1, 1.4, 0.8, 1.2, 1],
        filter: [
          `drop-shadow(0 0 2px ${color}) brightness(1)`,
          `drop-shadow(0 0 20px ${color}) brightness(2.5)`,
          `drop-shadow(0 0 5px white) brightness(1.2)`,
          `drop-shadow(0 0 25px white) brightness(3.0)`,
          `drop-shadow(0 0 2px ${color}) brightness(1)`,
        ],
        backgroundColor: [color, '#ffffff', color, '#fbbf24', color],
      };
    } else if (behavior === 'twinkle') {
      return {
        ...baseAnimate,
        opacity: [1, 0.1, 1, 0.3, 1],
        scale: [1.1, 0.9, 1.2, 0.85, 1.1],
        filter: [
          `drop-shadow(0 0 10px ${color})`,
          `drop-shadow(0 0 2px ${color})`,
          `drop-shadow(0 0 12px ${color})`,
          `drop-shadow(0 0 4px ${color})`,
          `drop-shadow(0 0 10px ${color})`,
        ],
        backgroundColor: [color, color, i % 2 === 0 ? '#ffffff' : color, color, color],
      };
    } else if (behavior === 'pulse') {
      return {
        ...baseAnimate,
        scale: [1, 1.3, 1],
        opacity: [0.8, 1, 0.8],
        filter: [
          `drop-shadow(0 0 5px ${color})`,
          `drop-shadow(0 0 15px ${color})`,
          `drop-shadow(0 0 5px ${color})`,
        ],
        backgroundColor: [color, i % 3 === 0 ? '#60a5fa' : color, color],
      };
    } else {
      // glow
      return {
        ...baseAnimate,
        opacity: [0.9, 1, 0.9],
        filter: [
          `drop-shadow(0 0 8px ${color}) brightness(1.2)`,
          `drop-shadow(0 0 18px ${color}) brightness(1.8)`,
          `drop-shadow(0 0 8px ${color}) brightness(1.2)`,
        ],
        backgroundColor: [color, color, '#ffffff', color],
      };
    }
  };

  return (
    <div className="absolute top-24 left-8 z-[60] pointer-events-none filter drop-shadow-xl opacity-95 hover:opacity-100 transition-opacity">
      <div className="relative flex flex-col items-center">
        {/* --- THE STAR --- */}
        <motion.div
          className="z-20 text-yellow-300 mb-[-6px] relative origin-center"
          animate={{
            scale: [1, 1.35, 0.95, 1.1, 1],
            rotate: [0, 15, -15, 5, 0],
            filter: [
              'drop-shadow(0 0 10px rgba(253,224,71,0.7))',
              'drop-shadow(0 0 35px rgba(253,224,71,1)) brightness(1.5)',
              'drop-shadow(0 0 15px rgba(255,255,255,0.8)) brightness(1.2)',
              'drop-shadow(0 0 10px rgba(253,224,71,0.7))',
            ],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Star size={32} fill="currentColor" />
          <motion.div
            className="absolute inset-0 bg-white/60 rounded-full blur-xl -z-10"
            animate={{ opacity: [0, 0.9, 0], scale: [0.5, 2.5, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>

        {/* --- TREE TIERS --- */}
        <div className="w-0 h-0 border-l-[25px] border-l-transparent border-r-[25px] border-r-transparent border-b-[30px] border-b-green-600 relative z-10"></div>
        <div className="w-0 h-0 border-l-[35px] border-l-transparent border-r-[35px] border-r-transparent border-b-[40px] border-b-green-700 -mt-3 relative z-10"></div>
        <div className="w-0 h-0 border-l-[45px] border-l-transparent border-r-[45px] border-r-transparent border-b-[50px] border-b-green-900 -mt-3 relative z-10"></div>

        {/* --- THE TRUNK --- */}
        <div className="w-8 h-8 bg-gradient-to-b from-amber-900 to-black rounded-sm mt-[-1px] shadow-lg border-t border-white/5" />

        {/* --- THE ORNAMENTS (Spectra-Twinkle Engine) --- */}
        <div className="absolute top-[28px] inset-x-0 bottom-8 z-30 pointer-events-none">
          {ornaments.map((orn, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4)]"
              style={{
                top: orn.top,
                left: orn.left,
                width: orn.size,
                height: orn.size,
                backgroundColor: orn.color,
                marginLeft: `-${orn.size / 2}px`,
              }}
              animate={getOrnamentAnimation(orn, i)}
              transition={{
                duration:
                  (orn.behavior === 'sparkle' ? 1.5 : orn.behavior === 'twinkle' ? 2.5 : 3.5) +
                  Math.random() * 2,
                times: [0, 0.15, 0.5, 0.85, 1],
                repeat: Infinity,
                delay: orn.delay + Math.random() * 3,
                ease: 'easeInOut',
              }}
            >
              {/* Inner Shimmer Sparkle */}
              <motion.div
                className="absolute inset-0 bg-white rounded-full blur-[0.5px]"
                animate={{ opacity: [0, 0.8, 0], scale: [0.8, 1.2, 0.8] }}
                transition={{
                  duration: 0.6 + Math.random(),
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
              <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white/90 rounded-full blur-[0.2px]" />
            </motion.div>
          ))}
        </div>

        {/* --- MAGIC TREE DUST (Subtle Atmospheric Particles) --- */}
        <div className="absolute inset-0 flex items-center justify-center">
          {Array.from({ length: 24 }).map((_, i) => (
            <motion.div
              key={`dust-${i}`}
              className="absolute w-0.5 h-0.5 bg-yellow-50 rounded-full shadow-[0_0_5px_white]"
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{
                x: (Math.random() - 0.5) * 160,
                y: (Math.random() - 0.5) * 180,
                opacity: [0, 0.8, 0],
                scale: [0, 2, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 5,
                repeat: Infinity,
                delay: Math.random() * 10,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// --- AUDIO HOOK FOR INTERACTIVE FEEDBACK ---
const useSnowGlobeAudio = (intensity: number) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const windNodeRef = useRef<GainNode | null>(null);
  const rattleNodeRef = useRef<GainNode | null>(null);
  const windFilterRef = useRef<BiquadFilterNode | null>(null);

  useEffect(() => {
    const AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // White Noise Source for Wind
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    windFilterRef.current = filter;
    filter.type = 'bandpass';
    filter.frequency.value = 400;
    filter.Q.value = 1.0;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    windNodeRef.current = gain;

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noiseSource.start();

    // Rattle component for high intensity
    const rattleGain = ctx.createGain();
    rattleGain.gain.value = 0;
    rattleNodeRef.current = rattleGain;

    const rattleOsc = ctx.createOscillator();
    rattleOsc.type = 'square'; // Harsh rattle sound
    rattleOsc.frequency.value = 50;
    const rattleFilter = ctx.createBiquadFilter();
    rattleFilter.type = 'highpass';
    rattleFilter.frequency.value = 1000;

    rattleOsc.connect(rattleFilter);
    rattleFilter.connect(rattleGain);
    rattleGain.connect(ctx.destination);
    rattleOsc.start();

    return () => {
      ctx.close();
    };
  }, []);

  useEffect(() => {
    if (windNodeRef.current && rattleNodeRef.current && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      const t = ctx.currentTime;

      // Smoothly interpolate wind gain
      const windLevel = Math.min(intensity, 1) * 0.15;
      windNodeRef.current.gain.linearRampToValueAtTime(windLevel, t + 0.1);

      // Rattle only at high intensity
      const rattleLevel = intensity > 1.2 ? (intensity - 1.2) * 0.1 : 0;
      rattleNodeRef.current.gain.linearRampToValueAtTime(rattleLevel, t + 0.05);

      // Dynamics: frequency shifts with intensity
      const filter = windFilterRef.current;
      if (filter) {
        filter.frequency.linearRampToValueAtTime(400 + intensity * 800, t + 0.1);
      }
    }
  }, [intensity]);
};

// 5. Interactive: Snow Globe (QUANTUM VORTEX EDITION - REFINED)
export const SnowGlobe = ({
  theme,
  containerRef,
}: {
  theme: BezelTheme;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) => {
  // All hooks must be called unconditionally before any early returns
  // We use motion values and springs for smooth persistence of the "shake" state
  const intensityRaw = useMotionValue(0);
  const intensity = useSpring(intensityRaw, { damping: 20, stiffness: 60 });

  const [shakeCount, setShakeCount] = useState(0);
  const agitationTimeout = useRef<number | null>(null);

  // Audio interaction
  const [currentIntensity, setCurrentIntensity] = useState(0);
  useEffect(() => {
    const unsubscribe = intensity.on('change', v => setCurrentIntensity(v));
    return unsubscribe;
  }, [intensity]);
  useSnowGlobeAudio(currentIntensity);

  // Physics constants
  const PARTICLE_COUNT = 150; // High volume blizzard

  // Derived visual effects for "Interactive Feel"
  const glassRefraction = useTransform(intensity, [0, 1.2, 3.0], [0, 6, 25]); // Drastic blur at high speed
  const blizzardWhiteout = useTransform(intensity, [0.5, 1.5, 3.0], [0, 0.3, 0.9]); // Obscures miniature scene
  const shimmerIntensity = useTransform(intensity, [0, 3.0], [0.1, 0.8]);
  const shimmerMovement = useTransform(intensity, (v: number) => `${v * 25}% ${v * 20}%`);
  const glareX = useTransform(intensity, (v: number) => `${50 + v * 15}%`);
  const flareScale = useTransform(intensity, [0.5, 2.5, 3.0], [0, 1.2, 1.8]);
  const rotateTransform = useTransform(
    intensity,
    (v: number) => Math.sin(Date.now() / 15) * v * 15
  );
  const scaleTransform = useTransform(intensity, [0, 3.0], [1, 2.5]);
  const glassBlurTransform = useTransform(
    glassRefraction,
    (b: number) => `blur(${b}px) contrast(${1 + b * 0.1})`
  );
  const shakeXTransform = useTransform(intensity, (v: number) => (Math.random() - 0.5) * v * 20);
  const shakeYTransform = useTransform(intensity, (v: number) => (Math.random() - 0.5) * v * 12);

  // Early return after all hooks are called
  if (theme !== 'christmas') return null;

  const handleDrag = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { velocity: { x: number; y: number } }
  ) => {
    // Calculate velocity magnitude
    const speed = Math.sqrt(info.velocity.x ** 2 + info.velocity.y ** 2);

    // Intensity scale (0-3.0 for extreme shaking)
    // Highly responsive agitation mapping
    const newIntensity = Math.min(Math.pow(speed / 350, 1.1), 3.0);

    if (newIntensity > 0.05) {
      intensityRaw.set(newIntensity);

      // Visual pulse on high velocity
      if (newIntensity > 1.8) {
        setShakeCount(prev => prev + 1);
      }

      // Auto-settle timer
      if (agitationTimeout.current) window.clearTimeout(agitationTimeout.current);
      agitationTimeout.current = window.setTimeout(() => {
        intensityRaw.set(0);
        setShakeCount(0);
      }, 3000);
    }
  };

  return (
    <motion.div
      drag
      dragConstraints={containerRef}
      dragElastic={0.2}
      dragMomentum={true}
      onDrag={handleDrag}
      whileHover={{ scale: 1.05, cursor: 'grab' }}
      whileTap={{ scale: 0.95, cursor: 'grabbing' }}
      className="absolute bottom-12 left-12 z-[100] group"
    >
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-black/90 text-cyan-200 text-[10px] px-4 py-1.5 rounded-full border border-cyan-500/30 whitespace-nowrap pointer-events-none shadow-[0_0_20px_rgba(6,182,212,0.4)] tracking-tighter uppercase font-bold">
        Shake for Quantum Blizzard
      </div>

      <motion.div
        className="relative w-56 h-56 filter drop-shadow-[0_40px_90px_rgba(0,0,0,0.95)]"
        style={{
          rotate: rotateTransform,
        }}
        animate={shakeCount > 0 ? { scale: [1, 1.12, 1] } : {}}
        transition={{ duration: 0.1 }}
      >
        {/* GLASS SPHERE */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-100/40 via-transparent to-blue-900/60 backdrop-blur-[1.5px] border-2 border-white/60 shadow-[inset:0_0_120px_rgba(255,255,255,0.75),0_0_60px_rgba(191,219,254,0.8)] overflow-hidden z-20">
          {/* Surface Shimmer Layer - Reactive to shake */}
          <motion.div
            className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] pointer-events-none mix-blend-screen z-[35]"
            style={{
              opacity: shimmerIntensity,
              backgroundPosition: shimmerMovement,
              scale: scaleTransform,
              filter: 'brightness(2) contrast(1.5) blur(0.5px)',
            }}
          />

          {/* Reactive Lens Flare - Pops on fast movement */}
          <motion.div
            className="absolute top-1/4 left-1/4 z-[37] pointer-events-none"
            style={{ scale: flareScale }}
          >
            <Sparkles size={64} className="text-white fill-white opacity-40 blur-[2px]" />
            <motion.div
              className="absolute inset-0 bg-cyan-400 rounded-full blur-[30px] opacity-20"
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          </motion.div>

          {/* Dynamic Glare - Shifts with drag velocity */}
          <motion.div
            className="absolute -top-4 left-[-10%] w-[120%] h-[40%] bg-gradient-to-b from-white/40 to-transparent blur-[20px] pointer-events-none rotate-[-15deg] z-[36]"
            style={{ left: glareX }}
          />

          <div className="absolute -top-[100%] -left-[100%] w-[300%] h-[300%] bg-gradient-to-br from-transparent via-white/50 to-transparent rotate-45 group-hover:translate-x-[60%] group-hover:translate-y-[60%] transition-transform duration-1000 ease-out pointer-events-none" />

          {/* Surface caustic highlights */}
          <div className="absolute top-4 left-16 w-32 h-16 bg-white/40 rounded-full rotate-[-35deg] blur-[15px] pointer-events-none" />
          <div className="absolute bottom-10 right-16 w-16 h-10 bg-blue-200/20 rounded-full rotate-[15deg] blur-[10px] pointer-events-none" />

          {/* BLIZZARD WHITEOUT - Obscures miniature scene on high intensity */}
          <motion.div
            className="absolute inset-0 bg-white/60 blur-[30px] pointer-events-none z-[25]"
            style={{ opacity: blizzardWhiteout }}
          />

          {/* VORTEX ENGINE - Procedural Snowflakes */}
          {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
            <VortexSnowflake key={i} index={i} intensity={intensity} />
          ))}

          {/* MINIATURE SCENE */}
          <motion.div
            className="absolute bottom-6 left-0 w-full h-full pointer-events-none origin-bottom flex flex-col items-center"
            style={{
              filter: glassBlurTransform,
              x: shakeXTransform,
              y: shakeYTransform,
              scale: 0.88,
            }}
          >
            {/* Ground with extra shimmer */}
            <div className="absolute bottom-0 w-[160%] h-20 bg-gradient-to-b from-white via-blue-50 to-slate-200 rounded-t-full shadow-[inset:0_0_10px_30px_rgba(0,0,0,0.25)] border-t border-white/60" />

            {/* North Pole Outpost */}
            <div className="absolute bottom-14 right-14 z-10 scale-95">
              <div className="w-20 h-16 bg-[#5d4037] rounded-sm relative shadow-2xl border border-[#3e2723]">
                <motion.div
                  className="absolute top-2 left-2 w-6 h-6 bg-yellow-100 shadow-[0_0_30px_yellow]"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.0, repeat: Infinity }}
                />
                <div className="absolute -top-11 -left-2 w-0 h-0 border-l-[38px] border-l-transparent border-r-[38px] border-r-transparent border-b-[38px] border-b-[#263238]" />
                <div className="absolute -top-12 -left-3 w-0 h-0 border-l-[41px] border-l-transparent border-r-[41px] border-r-transparent border-b-[41px] border-b-white/95 scale-y-115 -translate-y-[2px]" />
              </div>
            </div>

            {/* Decorated Pine */}
            <div className="absolute bottom-14 left-18 flex flex-col items-center z-10 scale-[1.35]">
              <div className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-b-[24px] border-b-green-500 relative">
                <div className="absolute -top-2 left-0 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_12px_red] animate-blink-holiday" />
              </div>
              <div className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[40px] border-b-green-800 -mt-2" />
              <div className="w-6 h-8 bg-[#3e2723] mt-[-1px]" />
            </div>

            {/* Snow Observer */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
              <div className="w-11 h-11 bg-white rounded-full shadow-md relative border border-slate-100">
                <div className="absolute top-4 left-3 w-1.5 h-1.5 bg-black rounded-full" />
                <div className="absolute top-4 right-3 w-1.5 h-1.5 bg-black rounded-full" />
                <div className="absolute top-7 left-1/2 -translate-x-1/2 w-6 h-3 bg-orange-600 rounded-full" />
              </div>
              <div className="w-15 h-15 bg-white rounded-full -mt-1 shadow-md border border-slate-100" />
              <div className="w-18 h-18 bg-white rounded-full -mt-2 shadow-md border border-slate-100" />
            </div>
          </motion.div>
        </div>

        {/* HEAVY WOODEN BASE */}
        <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-52 h-24 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.85)] flex flex-col items-center justify-center z-30 overflow-hidden border-2 border-[#2b1b17] bg-[#422c26]">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#2b1b17] via-[#5d4037] to-[#2b1b17]" />
          <div className="relative w-44 h-14 bg-black/60 rounded-md border border-white/5 flex items-center justify-center shadow-inner group-hover:border-cyan-500/80 transition-all duration-300">
            <span className="text-[15px] text-amber-50/90 font-serif tracking-[0.45em] font-black drop-shadow-2xl uppercase">
              North Expedition
            </span>
          </div>
          {/* Metal plaque bolts */}
          <div className="absolute top-5 left-7 w-3 h-3 bg-gray-600 rounded-full shadow-inner" />
          <div className="absolute top-5 right-7 w-3 h-3 bg-gray-600 rounded-full shadow-inner" />
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * Sub-component for individual snowflakes using high-performance Motion Transforms.
 * Implements a centrifugal blizzard logic where particles hug the edges during high speed.
 */
const VortexSnowflake = ({
  index,
  intensity,
}: {
  index: number;
  intensity: ReturnType<typeof useSpring>;
  key?: React.Key;
}) => {
  // Unique identity for each flake
  const seed = useRef(Math.random());
  const initialX = seed.current * 100;
  const initialY = seed.current * 100;

  // Orbit parameters
  const baseOrbitRadius = 10 + seed.current * 80;
  const speedFactor = 1.3 + seed.current * 5.0;
  const size = 1.5 + seed.current * 5.0;
  const swirlDirection = seed.current > 0.5 ? 1 : -1;

  // Position Transforms
  const x = useTransform(intensity, (v: number) => {
    const time = Date.now() / (400 / (speedFactor + v * 10)); // Drastically faster time scaling for vigorous swirl

    // Centrifugal force: move towards the edges (95-98%) at high intensity
    const radiusAdjustment = v > 0.1 ? Math.min(baseOrbitRadius + v * 65, 98) : baseOrbitRadius;

    const swirlX =
      initialX +
      Math.cos(time * swirlDirection + index) * radiusAdjustment * Math.min(v + 0.2, 1.8);
    const driftX = initialX + Math.sin(time * 0.4) * 15;

    // Turbulence at high agitation
    const turbulence = v > 1.2 ? (Math.random() - 0.5) * v * 20 : 0;

    return `${v > 0.1 ? swirlX + turbulence : driftX}%`;
  });

  const y = useTransform(intensity, (v: number) => {
    const time = Date.now() / (400 / (speedFactor + v * 10));

    const radiusAdjustment = v > 0.1 ? Math.min(baseOrbitRadius + v * 65, 98) : baseOrbitRadius;

    const swirlY =
      initialY +
      Math.sin(time * swirlDirection + index) * radiusAdjustment * Math.min(v + 0.2, 1.8);

    // Gravity cycle - speed increases with vibration intensity
    const gravityCycle = (Date.now() / (30 + seed.current * 15) + index * 45) % 100;

    const turbulence = v > 1.2 ? (Math.random() - 0.5) * v * 20 : 0;

    return `${v > 0.1 ? swirlY + turbulence : gravityCycle}%`;
  });

  // High intensity makes particles sparkle and glow
  const opacity = useTransform(intensity, (v: number) => {
    const base = 0.5 + Math.min(v * 0.5, 0.4);
    if (v > 1.5) {
      return base + Math.sin(Date.now() / 25 + index) * 0.5;
    }
    return base;
  });

  const scale = useTransform(intensity, [0, 2.0, 3.0], [1, 2.5, 3.5]);
  const glow = useTransform(intensity, [1.0, 3.0], [0, 35]);

  return (
    <motion.div
      className="absolute bg-white rounded-full pointer-events-none z-30"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        opacity,
        scale,
        boxShadow: useTransform(glow, (g: number) => `0 0 ${g}px rgba(255,255,255,1)`),
        filter: useTransform(intensity, (v: number) =>
          v > 1.2 ? 'blur(0.5px) brightness(2)' : 'none'
        ),
      }}
    />
  );
};

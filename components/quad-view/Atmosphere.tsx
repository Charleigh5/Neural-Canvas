import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BezelTheme, ThemeConfig } from '../../types';

// 1. Atmosphere: Aurora
export const AuroraBorealis = ({ theme }: { theme: BezelTheme }) => {
  if (theme !== 'christmas') return null;
  return (
    <div className="absolute inset-0 z-0 opacity-40 pointer-events-none mix-blend-screen bg-[linear-gradient(135deg,#020617_0%,#064e3b_50%,#1e1b4b_100%)] bg-[length:200%_200%] animate-[aurora-drift_20s_ease_infinite_alternate]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent_70%)]" />
    </div>
  );
};

// 2. Weather: Snow & Frost (Supports Custom Config)
export const BlizzardProtocol = ({
  theme,
  density,
  config,
}: {
  theme: BezelTheme;
  density: number;
  config?: ThemeConfig;
}) => {
  // Enable if theme is frost/christmas OR config sets overlay to snow
  const isActive = theme === 'frost' || theme === 'christmas' || config?.overlayType === 'snow';

  if (!isActive) return null;

  // Use custom density if provided in config
  const effectiveDensity = config?.particleDensity ?? density;
  const ratio = Math.max(0, effectiveDensity / 50);
  if (ratio === 0) return null;

  // We only render the atmospheric fog here, falling snow is in FallingSnow component if merged,
  // but typically FallingSnow is handled separately. Assuming FallingSnow is used for particles.
  // If this component handles the fog layer:
  return (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 z-50 opacity-40 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(200,230,255,0.1)_90%,rgba(255,255,255,0.3)_100%)] pointer-events-none" />
      <FallingSnow theme={theme} density={effectiveDensity} config={config} />
    </div>
  );
};

// 3. Digital Frost Accumulation
export const DigitalFrost = ({ active }: { active: boolean }) => {
  const [frost, setFrost] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (active) {
      interval = setInterval(() => {
        setFrost(f => Math.min(1, f + 0.005));
      }, 100);
    } else {
      setFrost(0);
    }
    return () => clearInterval(interval);
  }, [active]);

  if (frost === 0) return null;

  return (
    /* eslint-disable react/forbid-dom-props */
    <div
      className="absolute inset-0 pointer-events-none z-[60] mix-blend-screen transition-opacity duration-1000 opacity-[var(--frost-opacity)]"
      style={{ '--frost-opacity': frost } as React.CSSProperties}
    >
      {/* eslint-enable react/forbid-dom-props */}
      {/* Edge Frost */}
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(255,255,255,0.8)] blur-[20px]" />
      <div className="absolute top-0 left-0 w-64 h-64 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] rotate-45 opacity-60 scale-150" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] -rotate-135 opacity-60 scale-150" />
    </div>
  );
};

export const ChimneyVents = ({ theme, config }: { theme: BezelTheme; config?: ThemeConfig }) => {
  const isActive = theme === 'christmas' || config?.overlayType === 'embers';

  // Pre-compute random values to avoid recalculation on re-render
  const smokeParticles = React.useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        left: `${30 + Math.random() * 40}%`,
        delay: `${i * 0.5}s`,
        duration: `${4 + Math.random()}s`,
      })),
    []
  );

  if (!isActive) return null;

  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 z-[5] pointer-events-none overflow-hidden flex justify-center">
      {smokeParticles.map((particle, i) => (
        /* eslint-disable react/forbid-dom-props */
        <div
          key={i}
          className="w-10 h-10 bg-white/10 rounded-full blur-2xl absolute bottom-0 animate-smoke left-[var(--smoke-left)]"
          style={
            {
              '--smoke-left': particle.left,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            } as React.CSSProperties
          }
        />
        /* eslint-enable react/forbid-dom-props */
      ))}
    </div>
  );
};

export const FallingSnow = ({
  theme,
  density,
  config,
}: {
  theme: BezelTheme;
  density: number;
  config?: ThemeConfig;
}) => {
  const isActive = theme === 'christmas' || theme === 'frost' || config?.overlayType === 'snow';

  // Pre-compute snowflake properties to avoid recalculation
  const snowflakes = React.useMemo(() => {
    const count = Math.floor(density * 1.5);
    return Array.from({ length: count }).map(() => {
      const size = Math.random() * 3 + 1;
      return {
        size: `${size}px`,
        left: `${Math.random() * 100}%`,
        opacity: Math.random() * 0.6 + 0.2,
        duration: `${12 + Math.random() * 15}s`,
        delay: `-${Math.random() * 20}s`,
      };
    });
  }, [density]);

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
      {snowflakes.map((flake, i) => (
        /* eslint-disable react/forbid-dom-props */
        <div
          key={i}
          className="absolute bg-white rounded-full animate-snowfall w-[var(--snow-size)] h-[var(--snow-size)] left-[var(--snow-left)] opacity-[var(--snow-opacity)] -top-1"
          style={
            {
              '--snow-size': flake.size,
              '--snow-left': flake.left,
              '--snow-opacity': flake.opacity,
              animationDuration: flake.duration,
              animationDelay: flake.delay,
            } as React.CSSProperties
          }
        />
        /* eslint-enable react/forbid-dom-props */
      ))}
    </div>
  );
};

export const IcicleFormation = ({ theme, config }: { theme: BezelTheme; config?: ThemeConfig }) => {
  const isActive = theme === 'christmas' || theme === 'frost' || config?.overlayType === 'snow';
  if (!isActive) return null;
  return (
    <div className="absolute top-0 left-0 right-0 h-24 z-40 pointer-events-none flex justify-around">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 bg-gradient-to-b from-white/80 to-transparent rounded-full shadow-[0_0_10px_white]"
          style={{ height: Math.random() * 40 + 20 }}
          animate={{ scaleY: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
};

export const YuleFireplace = ({ theme, config }: { theme: BezelTheme; config?: ThemeConfig }) => {
  const isActive = theme === 'christmas' || config?.overlayType === 'embers';
  if (!isActive) return null;

  const color = config?.overlayType === 'embers' ? 'bg-orange-600/5' : 'bg-orange-600/5';

  return (
    <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[300px] z-0 pointer-events-none overflow-visible flex flex-col items-center">
      <motion.div
        className={`absolute bottom-0 w-[1200px] h-[600px] ${color} blur-[120px] rounded-full`}
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </div>
  );
};

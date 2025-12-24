
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Gift, Star, Wind, Snowflake, Zap } from 'lucide-react';
import { BezelTheme } from '../../types';

/**
 * Magic Trail Particle
 * High-speed particles with erratic spiral motion and varying spectral glow.
 * Moved outside SleighSquad to fix TypeScript 'key' prop assignment issues and optimize rendering.
 */
const MagicParticle = ({ index, color, isFrost = false }: { index: number; color: string; isFrost?: boolean; key?: React.Key }) => (
  <motion.div
    className={`absolute rounded-full ${color}`}
    style={{
      width: isFrost ? Math.random() * 10 + 2 : Math.random() * 6 + 1,
      height: isFrost ? Math.random() * 10 + 2 : Math.random() * 6 + 1,
      filter: isFrost ? 'blur(4px)' : 'blur(2px)',
      zIndex: isFrost ? -1 : 5,
    }}
    initial={{ x: 0, y: 0, opacity: 0 }}
    animate={{
      x: [-10, -400 - Math.random() * 300],
      y: [(Math.random() - 0.5) * 60, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 120],
      opacity: [0, 1, 0.7, 0],
      scale: [0.3, 3, 1.2, 0],
      rotate: [0, Math.random() * 1440],
    }}
    transition={{
      duration: 2.0 + Math.random() * 2.5,
      repeat: Infinity,
      delay: Math.random() * 5,
      ease: 'easeOut',
    }}
  >
    {isFrost ? (
      <Snowflake size={8} className="text-white opacity-40" />
    ) : (
      index % 8 === 0 && <Star size={5} className="text-yellow-100 opacity-70" fill="currentColor" />
    )}
  </motion.div>
);

/**
 * Reindeer Team Sub-component
 * Each reindeer pair is independently animated with hoof-to-air magical interaction.
 * Moved outside SleighSquad to fix TypeScript issues and optimize rendering.
 */
const ReindeerTeam = ({
  isLead = false,
  delay = 0,
  opacity = 1,
  scale = 1,
}: {
  isLead?: boolean;
  delay?: number;
  opacity?: number;
  scale?: number;
  key?: React.Key;
}) => (
  <motion.div
    className="flex items-center space-x-[-15px] relative"
    style={{ opacity }}
    animate={{
      y: [0, -15 * scale, 0],
      rotate: [0, -4, 4, 0],
      scale: [scale, scale * 1.03, scale],
    }}
    transition={{
      duration: 2.8,
      repeat: Infinity,
      ease: 'easeInOut',
      delay,
    }}
  >
    {/* Magical Wake behind each Reindeer */}
    <div className="absolute top-1/2 left-0 w-32 h-16 pointer-events-none -z-10 translate-x-[-80%]">
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-[1px] bg-gradient-to-l from-cyan-400/40 via-yellow-200/20 to-transparent"
          style={{ width: 40 + Math.random() * 60, top: `${20 + i * 20}%` }}
          animate={{ x: [0, -120], opacity: [0, 1, 0], scaleY: [1, 3, 1] }}
          transition={{ duration: 0.4, repeat: Infinity, delay: Math.random() }}
        />
      ))}
    </div>

    {/* Reindeer Model (Emoji base with CSS enhancements) */}
    <div className="relative text-5xl group">
      <span className="relative z-10 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">🦌</span>

      {/* Individual Hoof Sparks */}
      {[0, 1, 2, 3].map((h) => (
        <motion.div
          key={h}
          className="absolute -bottom-3 text-yellow-300 pointer-events-none"
          style={{ left: `${10 + h * 8}px` }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.3, 2.2, 0.3],
            y: [0, 20],
            x: [0, -40],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: Math.random() + h * 0.15,
          }}
        >
          <Sparkles size={14} className="fill-current" />
        </motion.div>
      ))}

      {isLead ? (
        <div className="absolute top-[60%] left-1 w-4 h-4 bg-red-600 rounded-full shadow-[0_0_30px_red,0_0_60px_rgba(220,38,38,1)] animate-pulse z-20">
          <div className="absolute inset-0 bg-white rounded-full opacity-70 blur-[2px] animate-ping" />
        </div>
      ) : (
        <div className="absolute top-[60%] left-1 w-2.5 h-2.5 bg-yellow-400 rounded-full shadow-[0_0_18px_yellow] z-20" />
      )}

      {/* Antler Shimmer layer */}
      <div className="absolute -top-3 -left-3 w-12 h-12 bg-cyan-400/20 blur-2xl rounded-full animate-pulse" />

      {/* Bridle/Rein Line - Slightly animated slack */}
      <motion.div
        className="absolute top-[45%] left-6 w-14 h-[1.5px] bg-gradient-to-r from-yellow-400/80 to-transparent origin-left"
        animate={{ rotate: [8, 22, 8], opacity: [0.4, 0.8, 0.4], scaleX: [1, 1.2, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>

    {/* Background Reindeer (Depth effect) */}
    {!isLead && opacity === 1 && (
      <div className="relative text-5xl transform translate-x-4 -translate-y-3 opacity-60 filter blur-[1.5px] scale-90">
        🦌
        <div className="absolute top-[60%] left-1 w-2 h-2 bg-yellow-400/30 rounded-full shadow-[0_0_12px_yellow] z-20" />
      </div>
    )}
  </motion.div>
);

// 1. Entity: Santa with Magic Dust & Enhanced Reindeer Formation
export const SleighSquad = ({ theme }: { theme: BezelTheme }) => {
  if (theme !== 'christmas') return null;

  return (
    <div className="absolute top-0 left-0 w-full h-full z-[60] pointer-events-none overflow-hidden">
      {/* --- THE SPECTRAL ESCORT (Flanking Reindeer) --- */}
      <div
        className="animate-sleigh absolute"
        style={{ top: '35%', left: '0', animationDelay: '-2s', animationDuration: '22s' }}
      >
        <div className="flex flex-col gap-12 -translate-x-24 opacity-30 filter blur-[4px]">
          <ReindeerTeam key="escort-1" delay={0.1} opacity={0.4} scale={0.7} />
          <div className="translate-x-32">
            <ReindeerTeam key="escort-2" delay={0.4} opacity={0.3} scale={0.6} />
          </div>
        </div>
      </div>

      {/* --- MAIN FLIGHT SQUADRON --- */}
      <div className="animate-sleigh absolute" style={{ top: '15%', left: '0', zIndex: 20 }}>
        <div className="relative flex items-center scale-110">
          {/* Reindeer Team Formation */}
          <div className="flex items-center space-x-3 mr-6">
            <ReindeerTeam key="main-1" isLead={true} delay={0} />
            <ReindeerTeam key="main-2" delay={0.3} />
            <ReindeerTeam key="main-3" delay={0.6} />
            <ReindeerTeam key="main-4" delay={0.9} />
          </div>

          {/* The Sleigh */}
          <div className="relative group">
            {/* MAGIC ENGINE GLOW (Holographic core) */}
            <div className="absolute inset-0 bg-red-600/20 blur-[90px] rounded-full scale-[5] -z-10 animate-pulse" />
            <div className="absolute inset-0 bg-yellow-400/15 blur-[120px] rounded-full scale-[6] -z-10" />

            {/* Sleigh Model */}
            <div className="text-7xl filter drop-shadow-[0_0_50px_rgba(234,179,8,0.7)] relative z-10 transition-transform duration-500 group-hover:scale-110">
              🛷
            </div>
            <div className="absolute -top-10 left-8 text-5xl animate-bounce origin-bottom z-20">🎅</div>
            <div className="absolute -top-7 right-2 text-3xl animate-pulse z-20">🎁</div>

            {/* ENHANCED RUNNER TRAILS */}
            <div className="absolute bottom-1 left-0 w-full h-8">
              <svg className="absolute top-0 right-full w-[1000px] h-32 overflow-visible pointer-events-none opacity-95">
                <motion.path
                  d="M 1000,10 Q 500,45 0,10"
                  stroke="url(#runner-grad-gold-spectral)"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray="80 40"
                  animate={{ strokeDashoffset: [0, -480] }}
                  transition={{ duration: 0.45, repeat: Infinity, ease: 'linear' }}
                />
                <motion.path
                  d="M 1000,20 Q 500,65 0,20"
                  stroke="url(#runner-grad-frost-spectral)"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray="30 60"
                  animate={{ strokeDashoffset: [0, -900] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                />
              </svg>
            </div>

            {/* HIGH-VOLUME STARDUST VORTEX */}
            <div className="absolute bottom-2 left-[-120%] z-[-2] flex items-center justify-center">
              {Array.from({ length: 80 }).map((_, i) => (
                <MagicParticle
                  key={`mp-${i}`}
                  index={i}
                  color={
                    i % 5 === 0
                      ? 'bg-cyan-200'
                      : i % 5 === 1
                      ? 'bg-yellow-300'
                      : i % 5 === 2
                      ? 'bg-white'
                      : i % 5 === 3
                      ? 'bg-red-400'
                      : 'bg-emerald-300'
                  }
                  isFrost={i % 6 === 0}
                />
              ))}
            </div>

            {/* ATMOSPHERIC SPEED RIBBONS */}
            <div className="absolute -left-64 top-0 bottom-0 flex flex-col justify-around py-4 opacity-75">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <motion.div
                  key={`ribbon-${i}`}
                  className="h-[2px] bg-gradient-to-l from-white/95 via-cyan-200/40 to-transparent blur-[2px] origin-right"
                  style={{ width: 150 + Math.random() * 250 }}
                  animate={{
                    x: [0, -450],
                    y: [0, (Math.random() - 0.5) * 100, 0],
                    opacity: [0, 1, 0.4, 0],
                    scaleY: [1, 5, 1],
                  }}
                  transition={{
                    duration: 0.2 + Math.random() * 0.35,
                    repeat: Infinity,
                    delay: i * 0.08,
                    ease: 'easeIn',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Gradient Definitions */}
          <svg className="absolute w-0 h-0">
            <defs>
              <linearGradient id="runner-grad-gold-spectral" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#fef9c3" stopOpacity="1" />
                <stop offset="25%" stopColor="#fbbf24" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#d97706" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#451a03" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="runner-grad-frost-spectral" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#bae6fd" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* --- AMBIENT FESTIVE GLOWS (Trailing the formation) --- */}
      <div
        className="animate-sleigh absolute opacity-40 blur-[2px]"
        style={{ top: '45%', left: '15%', animationDuration: '35s' }}
      >
        <div className="flex gap-32 items-center">
          <Star size={24} className="text-yellow-100 animate-twinkle fill-current shadow-[0_0_20px_white]" />
          <Wind size={40} className="text-white/30 animate-pulse" />
          <Snowflake size={20} className="text-cyan-100 animate-spin-slow" />
          <Star size={18} className="text-white animate-twinkle" style={{ animationDelay: '1.8s' }} />
        </div>
      </div>
    </div>
  );
};

// 2. Entity: Yeti MK-II (Refined Observer)
export const YetiObserver = ({ theme }: { theme: BezelTheme }) => {
  if (theme !== 'christmas') return null;

  const [isThrowing, setIsThrowing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.25) {
        setIsThrowing(true);
        setTimeout(() => setIsThrowing(false), 1200);
      }
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute bottom-0 right-32 z-[15] pointer-events-none overflow-hidden w-64 h-64 flex items-end justify-center">
      <div className="animate-yeti transform translate-y-full origin-bottom">
        
        {/* FESTIVE SANTA HAT */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-20 pointer-events-none z-20 overflow-visible">
            <motion.div
              className="w-full h-full"
              animate={{ rotate: [-2, 2, -2] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-lg overflow-visible">
                {/* Red Hat Base (Floppy shape) */}
                <path d="M20,50 C20,20 40,5 60,5 C80,5 85,25 85,35" fill="#ef4444" />
                <path d="M20,50 C20,20 40,5 60,5 C80,5 85,25 85,35" fill="none" stroke="#b91c1c" strokeWidth="1" />
                
                {/* White Fur Trim */}
                <rect x="10" y="42" width="55" height="12" rx="6" fill="white" />
                
                {/* Dangling Pom-pom */}
                <motion.circle 
                  cx="85" cy="35" r="8" fill="white" 
                  className="drop-shadow-md"
                  animate={{ y: [0, 5, 0], x: [0, 2, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
              </svg>
            </motion.div>
        </div>

        <div className="relative w-32 h-28 bg-slate-100 rounded-t-[50px] shadow-2xl border border-slate-300">
          {/* Glowing Eyes */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-24 h-14 bg-blue-100/50 rounded-full flex items-center justify-center gap-4 border border-blue-200/30">
            <div className="w-4 h-4 bg-black rounded-full animate-blink relative">
              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full" />
            </div>
            <div className="w-4 h-4 bg-black rounded-full animate-blink relative">
              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full" />
            </div>
          </div>

          {/* Scarf / Texture */}
          <div className="absolute bottom-0 w-full h-10 bg-green-700 rounded-lg flex items-center justify-center gap-2 overflow-hidden border-t border-black/10 shadow-sm z-10">
            <div className="w-full h-full flex">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 ${i % 2 === 0 ? 'bg-red-600' : 'bg-green-700'} -skew-x-15 border-r border-black/10`}
                />
              ))}
            </div>
          </div>

          <AnimatePresence>
            {isThrowing && (
              <motion.div
                className="absolute top-1/2 left-0 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_white] z-50"
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0.5, 1.2, 0.8, 0],
                  x: -200,
                  y: [0, -70, 40],
                  rotate: 720,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// 3. Decoration: Animated Gift Boxes with Fluttering Ribbons
export const GiftBoxArray = ({ theme }: { theme: BezelTheme }) => {
  if (theme !== 'christmas') return null;

  const boxes = [
    { left: '35%', bottom: '2%', size: 36, color: '#ef4444', ribbon: '#fbbf24', rotate: -5 },
    { left: '39%', bottom: '4%', size: 28, color: '#22c55e', ribbon: '#ffffff', rotate: 10 },
    { left: '20%', top: '48%', size: 24, color: '#fbbf24', ribbon: '#ef4444', rotate: 0 },
    { left: '75%', top: '48%', size: 32, color: '#a855f7', ribbon: '#ffffff', rotate: -8 },
    { left: '85%', bottom: '5%', size: 26, color: '#3b82f6', ribbon: '#fbbf24', rotate: 12 },
  ];

  return (
    <div className="absolute inset-0 z-[55] pointer-events-none overflow-hidden">
      {boxes.map((box, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: box.left, bottom: box.bottom, top: box.top }}
          initial={{ rotate: box.rotate }}
          animate={{
            scale: [1, 1.1, 1],
            rotate: [box.rotate, box.rotate - 3, box.rotate + 3, box.rotate],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            repeatDelay: Math.random() * 2,
            ease: 'easeInOut',
          }}
        >
          <div className="relative group">
            <Gift
              size={box.size}
              color={box.ribbon}
              fill={box.color}
              fillOpacity={0.8}
              strokeWidth={1.5}
              className="drop-shadow-2xl relative z-10"
            />

            {/* FLUTTERING RIBBONS (Procedural path animation) */}
            <svg
              width={box.size * 2}
              height={box.size * 2}
              viewBox="0 0 48 48"
              className="absolute top-[-50%] left-[-50%] pointer-events-none overflow-visible z-20"
              style={{ opacity: 0.9 }}
            >
              {/* Left Ribbon End */}
              <motion.path
                d="M 24,12 Q 18,6 12,10"
                stroke={box.ribbon}
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                animate={{
                  d: ["M 24,12 Q 18,6 12,10", "M 24,12 Q 15,4 10,8", "M 24,12 Q 20,8 14,12", "M 24,12 Q 18,6 12,10"],
                }}
                transition={{
                  duration: 1.5 + Math.random() * 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.3,
                }}
              />
              {/* Right Ribbon End */}
              <motion.path
                d="M 24,12 Q 30,6 36,10"
                stroke={box.ribbon}
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                animate={{
                  d: ["M 24,12 Q 30,6 36,10", "M 24,12 Q 33,4 38,8", "M 24,12 Q 28,8 34,12", "M 24,12 Q 30,6 36,10"],
                }}
                transition={{
                  duration: 1.8 + Math.random() * 1.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.2,
                }}
              />
              {/* High-frequency shimmer sparks */}
              {Array.from({ length: 2 }).map((_, j) => (
                <motion.circle
                  key={j}
                  r="0.5"
                  fill="white"
                  animate={{
                    opacity: [0, 1, 0],
                    x: [24, 24 + (Math.random() - 0.5) * 20],
                    y: [12, 12 + (Math.random() - 0.5) * 20],
                  }}
                  transition={{ duration: 0.5 + Math.random(), repeat: Infinity }}
                />
              ))}
            </svg>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

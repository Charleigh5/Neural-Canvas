import React from 'react';
import { useStore } from '../../store/useStore';
import { AppMode } from '../../types';
import { Grid, Play, Layers, Camera, Hexagon } from 'lucide-react';
import { motion } from 'framer-motion';

export const NavigationDock = ({ docked = false }: { docked?: boolean }) => {
  const { mode, setMode, setCameraOpen, isCameraOpen, playReel, reel } = useStore();

  const NavItem = ({
    isActive,
    onClick,
    icon: Icon,
    label,
  }: {
    isActive: boolean;
    onClick: () => void;
    icon: any;
    label: string;
  }) => {
    return (
      <button
        onClick={onClick}
        className={`group relative flex flex-col items-center justify-center w-14 h-12 transition-all duration-300 ${isActive ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
      >
        <Icon
          size={20}
          strokeWidth={isActive ? 2.5 : 2}
          className="relative z-10 transition-transform duration-300 group-hover:scale-110"
        />

        <span
          className={`absolute bottom-1 text-[7px] font-black uppercase tracking-wider transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}
        >
          {label}
        </span>

        {isActive && (
          <motion.div
            layoutId="nav-pill-active"
            className="absolute inset-0 bg-white/5 rounded-xl -z-10"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
      </button>
    );
  };

  const positionClasses = docked
    ? 'fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-6'
    : 'fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-6';

  return (
    <div className={positionClasses}>
      {/* LEFT PILL: MANAGEMENT */}
      <div className="flex items-center bg-[#050505]/90 border border-white/10 backdrop-blur-2xl rounded-2xl p-1.5 pl-3 pr-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <NavItem
          isActive={mode === AppMode.CANVAS}
          onClick={() => setMode(AppMode.CANVAS)}
          icon={Layers}
          label="Constellation"
        />
        <div className="w-px h-6 bg-white/10 mx-1" />
        <NavItem
          isActive={mode === AppMode.ASSETS}
          onClick={() => setMode(AppMode.ASSETS)}
          icon={Grid}
          label="Assets"
        />
      </div>

      {/* CENTER: HOME ORB (REFINED ACCENTS) */}
      <div className="relative z-30">
        <motion.button
          whileHover="hover"
          whileTap="tap"
          onClick={() => setMode(AppMode.HOME)}
          className="relative group flex items-center justify-center outline-none"
        >
          {/* 1. Outer Orbital Ring (Dashed) */}
          <motion.div
            className={`absolute inset-[-8px] rounded-full border border-dashed transition-all duration-500 ${
              mode === AppMode.HOME
                ? 'border-indigo-500/60 opacity-100'
                : 'border-white/10 opacity-60 group-hover:border-indigo-400/40 group-hover:opacity-100'
            }`}
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          />

          {/* 2. Inner Core Ring (Opposite Rotation) */}
          <motion.div
            className={`absolute inset-[-2px] rounded-full border border-dotted transition-all duration-500 ${
              mode === AppMode.HOME
                ? 'border-indigo-400/40 opacity-80'
                : 'border-white/5 opacity-0 group-hover:opacity-40'
            }`}
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          />

          {/* 3. Sync Dots (Active Indicator) */}
          {mode === AppMode.HOME && (
            <div className="absolute inset-[-12px] animate-spin-slow pointer-events-none">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
            </div>
          )}

          {/* 4. Glow Layer */}
          <div
            className={`absolute inset-0 rounded-full blur-xl transition-all duration-500 ${
              mode === AppMode.HOME
                ? 'bg-indigo-600/40 scale-125'
                : 'bg-white/0 group-hover:bg-indigo-600/20'
            }`}
          />

          {/* 5. Main Core Button */}
          <motion.div
            className={`
                            w-16 h-16 rounded-full flex items-center justify-center border-2 backdrop-blur-xl shadow-2xl transition-all duration-300
                            ${
                              mode === AppMode.HOME
                                ? 'bg-white border-white scale-110 shadow-[0_0_40px_rgba(99,102,241,0.5)]'
                                : 'bg-[#0a0a0a] border-white/20 group-hover:border-indigo-400 group-hover:bg-[#0f0f12]'
                            }
                        `}
            variants={{
              hover: { scale: 1.1 },
              tap: { scale: 0.9 },
            }}
          >
            <Hexagon
              size={28}
              strokeWidth={2.5}
              className={`transition-all duration-300 ${
                mode === AppMode.HOME
                  ? 'text-indigo-600 fill-indigo-100 rotate-90'
                  : 'text-slate-400 group-hover:text-indigo-400 group-hover:rotate-12'
              }`}
            />
          </motion.div>
        </motion.button>
      </div>

      {/* RIGHT PILL: CREATION & PLAYBACK */}
      <div className="flex items-center bg-[#050505]/90 border border-white/10 backdrop-blur-2xl rounded-2xl p-1.5 pl-2 pr-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <NavItem
          isActive={isCameraOpen}
          onClick={() => setCameraOpen(true)}
          icon={Camera}
          label="Neural Optic"
        />
        <div className="w-px h-6 bg-white/10 mx-1" />
        <NavItem
          isActive={mode === AppMode.PLAYER}
          onClick={() => {
            if (reel.length > 0) playReel();
            else setMode(AppMode.PLAYER);
          }}
          icon={Play}
          label="Player"
        />
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { AppMode } from '../../types';
import { Grid, Play, Layers, Camera, Hexagon, MoreHorizontal, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HomeRow = ({ docked = false }: { docked?: boolean }) => {
  const { mode, setMode, setCameraOpen, isCameraOpen, playReel, reel, ui, toggleNavNode } =
    useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isConfigMode, setIsConfigMode] = useState(false);

  const navItems = [
    {
      id: 'constellation',
      icon: Layers,
      label: 'Constellation',
      isActive: mode === AppMode.CANVAS,
      onClick: () => setMode(AppMode.CANVAS),
    },
    {
      id: 'assets',
      icon: Grid,
      label: 'Assets',
      isActive: mode === AppMode.ASSETS,
      onClick: () => setMode(AppMode.ASSETS),
    },
    {
      id: 'camera',
      icon: Camera,
      label: 'Neural Optic',
      isActive: isCameraOpen,
      onClick: () => setCameraOpen(true),
    },
    {
      id: 'player',
      icon: Play,
      label: 'Player',
      isActive: mode === AppMode.PLAYER,
      onClick: () => {
        if (reel.length > 0) playReel();
        else setMode(AppMode.PLAYER);
      },
    },
  ];

  const visibleItems = navItems.filter(item => ui.visibleNavNodes.includes(item.id));

  const positionClasses = docked
    ? 'fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center justify-center'
    : 'fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center justify-center';

  return (
    <div className={positionClasses}>
      <motion.div
        layout
        className="relative flex items-center p-1.5 rounded-3xl bg-[#050505]/80 border border-white/10 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
        initial={{ borderRadius: 32 }}
        animate={{
          width: isOpen ? 'auto' : 'auto',
          gap: isOpen ? 12 : 0,
        }}
      >
        {/* LEFT WING */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0, x: 20 }}
              animate={{ opacity: 1, width: 'auto', x: 0 }}
              exit={{ opacity: 0, width: 0, x: 20 }}
              className="flex items-center gap-1 overflow-hidden"
            >
              {isConfigMode
                ? navItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => toggleNavNode(item.id)}
                      className="flex flex-col items-center justify-center w-12 h-12 text-slate-400 hover:text-white transition-colors relative"
                    >
                      <item.icon size={18} className="opacity-50" />
                      <div className="absolute top-1 right-1">
                        {ui.visibleNavNodes.includes(item.id) ? (
                          <Eye size={10} className="text-emerald-400" />
                        ) : (
                          <EyeOff size={10} className="text-rose-400" />
                        )}
                      </div>
                    </button>
                  ))
                : visibleItems
                    .slice(0, 2)
                    .map(item => (
                      <NavItem
                        key={item.id}
                        isActive={item.isActive}
                        onClick={item.onClick}
                        icon={item.icon}
                        label={item.label}
                      />
                    ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CENTER ORB */}
        <motion.button
          layout
          onClick={() => setIsOpen(!isOpen)}
          className="relative group z-50 flex items-center justify-center w-14 h-14 rounded-full outline-none"
        >
          {/* Orbital Ring */}
          <motion.div
            className={`absolute inset-0 rounded-full border border-dashed transition-all duration-500 ${
              mode === AppMode.HOME
                ? 'border-indigo-500/60 opacity-100'
                : 'border-white/20 opacity-60'
            }`}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />

          {/* Core */}
          <div
            className={`
              w-full h-full rounded-full flex items-center justify-center border-2 transition-all duration-300
              ${
                mode === AppMode.HOME
                  ? 'bg-white border-white shadow-[0_0_30px_rgba(99,102,241,0.6)]'
                  : 'bg-[#0a0a0a] border-white/20 group-hover:border-indigo-400'
              }
            `}
          >
            <Hexagon
              size={24}
              strokeWidth={2.5}
              className={`transition-all duration-300 ${
                mode === AppMode.HOME
                  ? 'text-indigo-600 fill-indigo-100 rotate-90'
                  : 'text-slate-400 group-hover:text-indigo-400'
              }`}
            />
          </div>
        </motion.button>

        {/* RIGHT WING */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0, x: -20 }}
              animate={{ opacity: 1, width: 'auto', x: 0 }}
              exit={{ opacity: 0, width: 0, x: -20 }}
              className="flex items-center gap-1 overflow-hidden"
            >
              {!isConfigMode && (
                <>
                  {visibleItems.slice(2).map(item => (
                    <NavItem
                      key={item.id}
                      isActive={item.isActive}
                      onClick={item.onClick}
                      icon={item.icon}
                      label={item.label}
                    />
                  ))}
                  <div className="w-px h-6 bg-white/10 mx-1" />
                </>
              )}

              {/* Config Toggle */}
              <button
                onClick={() => setIsConfigMode(!isConfigMode)}
                aria-label="Toggle visible panels"
                className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors ${
                  isConfigMode ? 'text-indigo-400 bg-white/5' : 'text-slate-500'
                }`}
              >
                <MoreHorizontal size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const NavItem = ({
  isActive,
  onClick,
  icon: Icon,
  label,
}: {
  isActive: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) => {
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center w-14 h-12 transition-all duration-300 ${
        isActive ? 'text-white' : 'text-slate-600 hover:text-slate-400'
      }`}
    >
      <Icon
        size={20}
        strokeWidth={isActive ? 2.5 : 2}
        className="relative z-10 transition-transform duration-300 group-hover:scale-110"
      />

      <span
        className={`absolute bottom-1 text-[7px] font-black uppercase tracking-wider transition-all duration-300 ${
          isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
        }`}
      >
        {label}
      </span>

      {isActive && (
        <motion.div
          layoutId="nav-pill-active"
          className="absolute inset-0 bg-white/10 rounded-xl -z-10"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        />
      )}
    </button>
  );
};

import React from 'react';
import { motion } from 'framer-motion';

interface HoloPanelProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  selected?: boolean;
}

export const TiltCard: React.FC<HoloPanelProps> = ({
  children,
  className = '',
  onClick,
  selected = false,
}) => {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick as React.MouseEventHandler}
      className={`
        relative group overflow-hidden bg-slate-900/40 border transition-all duration-300 backdrop-blur-md text-left w-full
        ${
          selected
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.3)]'
            : 'border-white/10 hover:border-indigo-500/50 hover:bg-slate-900/60 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]'
        }
        ${className}
      `}
      {...(onClick ? { type: 'button' } : {})}
    >
      {/* Bioluminescent Accents */}
      <div
        className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 transition-colors duration-300 ${selected ? 'border-indigo-400' : 'border-white/20 group-hover:border-indigo-500/50'}`}
      />
      <div
        className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 transition-colors duration-300 ${selected ? 'border-indigo-400' : 'border-white/20 group-hover:border-indigo-500/50'}`}
      />

      {/* Neural Scanline Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(99,102,241,0.03)_50%)] bg-[length:100%_4px] pointer-events-none" />

      {/* Active Glow Indicator */}
      {selected && (
        <motion.div
          layoutId="card-selection-glow"
          className="absolute inset-0 bg-indigo-500/5 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">{children}</div>

      {/* Hover Shimmer */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
    </Component>
  );
};

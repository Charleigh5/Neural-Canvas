import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface TabItemProps {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}

export const TabItem: React.FC<TabItemProps> = ({ active, onClick, icon: Icon, label }) => (
  <motion.button
    whileHover={{ backgroundColor: active ? 'rgba(79, 70, 229, 1)' : 'rgba(255,255,255,0.08)' }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all relative z-10 ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
  >
    <span className="flex items-center gap-1.5 relative z-10">
      <Icon size={11} /> {label}
    </span>
    {active && (
      <motion.div
        layoutId="nano-active-tab"
        className="absolute inset-0 bg-indigo-600 rounded-full shadow-lg"
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    )}
  </motion.button>
);

interface ToolBtnProps {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
}

export const ToolBtn: React.FC<ToolBtnProps> = ({ active, onClick, icon: Icon }) => (
  <motion.button
    whileHover={{
      scale: 1.1,
      backgroundColor: active ? 'rgba(79, 70, 229, 1)' : 'rgba(255,255,255,0.1)',
    }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className={`p-2 rounded-md transition-all ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
  >
    <Icon size={14} />
  </motion.button>
);

interface InpaintActionBtnProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  color: 'rose' | 'cyan';
  disabled?: boolean;
}

export const InpaintActionBtn: React.FC<InpaintActionBtnProps> = ({
  icon: Icon,
  label,
  onClick,
  color,
  disabled,
}) => (
  <motion.button
    whileHover={{
      backgroundColor: `rgba(${color === 'rose' ? '244, 63, 94' : '6, 182, 212'}, 0.15)`,
      scale: 1.02,
    }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    disabled={disabled}
    className={`p-3 bg-${color}-500/10 border border-${color}-500/20 rounded-xl transition-all flex items-center justify-center gap-3 group disabled:opacity-30 shadow-md`}
  >
    <Icon size={14} className={`text-${color}-400 group-hover:scale-110 transition-transform`} />
    <span className={`text-[9px] font-black uppercase text-${color}-300 tracking-widest`}>
      {label}
    </span>
  </motion.button>
);

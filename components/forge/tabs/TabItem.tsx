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
    className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all relative z-10 ${
      active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
    }`}
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

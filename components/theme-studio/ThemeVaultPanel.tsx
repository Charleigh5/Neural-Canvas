import React from 'react';
import { Library } from 'lucide-react';
import { ThemeConfig } from '../../types';
import { ThemeCard } from './ThemeCard';

interface ThemeVaultPanelProps {
  savedThemes: ThemeConfig[];
  activeThemeId?: string;
  onLoadTheme: (theme: ThemeConfig) => void;
  onDeleteTheme: (id: string) => void;
}

export const ThemeVaultPanel: React.FC<ThemeVaultPanelProps> = ({
  savedThemes,
  activeThemeId,
  onLoadTheme,
  onDeleteTheme,
}) => {
  return (
    <div className="w-72 border-r border-white/10 bg-[#050505] flex flex-col">
      <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
        <div className="flex items-center gap-2 mb-1">
          <Library className="text-emerald-500" size={18} />
          <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] shadow-emerald-500/20 drop-shadow-sm">
            Theme_Vault
          </h2>
        </div>
        <p className="text-[9px] text-slate-500 font-mono tracking-wide">
          Persisted Configurations
        </p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {savedThemes.length === 0 ? (
          <div className="p-4 border border-dashed border-white/10 rounded-xl text-center">
            <span className="text-[9px] text-slate-600 font-mono uppercase">Vault Empty</span>
          </div>
        ) : (
          savedThemes.map(theme => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isActive={activeThemeId === theme.id}
              onLoadTheme={onLoadTheme}
              onDeleteTheme={onDeleteTheme}
            />
          ))
        )}
      </div>
    </div>
  );
};

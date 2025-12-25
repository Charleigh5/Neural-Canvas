// Dynamic theme color swatches require inline styles - cannot be statically defined
import React from 'react';
import { Library, Trash2 } from 'lucide-react';
import { ThemeConfig } from '../../types';

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
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <Library className="text-emerald-500" size={18} />
          <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Theme_Vault</h2>
        </div>
        <p className="text-[9px] text-slate-500 font-mono">Persisted Configurations</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {savedThemes.length === 0 ? (
          <div className="p-4 border border-dashed border-white/10 rounded-xl text-center">
            <span className="text-[9px] text-slate-600 font-mono uppercase">Vault Empty</span>
          </div>
        ) : (
          savedThemes.map(theme => {
            const isActive = activeThemeId === theme.id;
            // eslint-disable-next-line react/forbid-dom-props
            return (
              <div
                key={theme.id}
                className={`group relative p-3 rounded-xl transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                    : 'bg-white/5 border-white/5 hover:border-emerald-500/30'
                }`}
                onClick={() => onLoadTheme(theme)}
                style={
                  {
                    '--theme-bezel': theme.bezelColor,
                    '--theme-accent': theme.accentColor,
                  } as React.CSSProperties
                }
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider ${
                      isActive ? 'text-emerald-400' : 'text-white'
                    }`}
                  >
                    {theme.name}
                  </span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onDeleteTheme(theme.id);
                    }}
                    aria-label="Delete theme"
                    className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                {/* Color swatches using CSS variables defined on parent */}
                <div className="mt-2 flex gap-1">
                  <div
                    className="w-3 h-3 rounded-full border border-white/20 bg-[var(--theme-bezel)]"
                    aria-label={`Bezel color: ${theme.bezelColor}`}
                  />
                  <div
                    className="w-3 h-3 rounded-full border border-white/20 bg-[var(--theme-accent)]"
                    aria-label={`Accent color: ${theme.accentColor}`}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

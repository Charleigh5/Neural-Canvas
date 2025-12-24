import React from 'react';
import { Library, Trash2 } from 'lucide-react';
import { ThemeConfig } from '../../types';

interface ThemeVaultPanelProps {
  savedThemes: ThemeConfig[];
  onLoadTheme: (theme: ThemeConfig) => void;
  onDeleteTheme: (id: string) => void;
}

export const ThemeVaultPanel: React.FC<ThemeVaultPanelProps> = ({
  savedThemes,
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
          savedThemes.map(theme => (
            <div
              key={theme.id}
              className="group relative p-3 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer"
              onClick={() => onLoadTheme(theme)}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-white uppercase tracking-wider">
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
              <div className="mt-2 flex gap-1">
                <div
                  className="w-3 h-3 rounded-full border border-white/20"
                  style={{ backgroundColor: theme.bezelColor }}
                />
                <div
                  className="w-3 h-3 rounded-full border border-white/20"
                  style={{ backgroundColor: theme.accentColor }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

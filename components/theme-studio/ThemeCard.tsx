import React, { useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { ThemeConfig } from '../../types';

interface ThemeCardProps {
  theme: ThemeConfig;
  isActive: boolean;
  onLoadTheme: (theme: ThemeConfig) => void;
  onDeleteTheme: (id: string) => void;
}

export const ThemeCard: React.FC<ThemeCardProps> = ({
  theme,
  isActive,
  onLoadTheme,
  onDeleteTheme,
}) => {
  // Memoize style object to prevent recreation on every render
  const themeStyle = useMemo(
    () =>
      ({
        '--theme-bezel': theme.bezelColor,
        '--theme-accent': theme.accentColor,
      }) as React.CSSProperties,
    [theme.bezelColor, theme.accentColor]
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onLoadTheme(theme);
    }
  };

  return (
    <div
      key={theme.id}
      className={`group relative p-3 rounded-xl transition-all border ${
        isActive
          ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
          : 'bg-white/5 border-white/5 hover:border-emerald-500/30'
      }`}
      {...{ style: themeStyle }}
    >
      <div className="flex items-center justify-between">
        {/* Clickable theme name area - keeps interactive role separate from delete button */}
        <div
          onClick={() => onLoadTheme(theme)}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          className="flex-1 cursor-pointer"
        >
          <span
            className={`text-[10px] font-black uppercase tracking-wider ${
              isActive ? 'text-emerald-400' : 'text-white'
            }`}
          >
            {theme.name}
          </span>
        </div>
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
      <div
        className="mt-2 flex gap-1 cursor-pointer"
        onClick={() => onLoadTheme(theme)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
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
};

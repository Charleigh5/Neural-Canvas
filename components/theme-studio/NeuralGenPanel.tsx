import React from 'react';
import { X, Sparkles, Wand2, Loader2, Dice5, Plus } from 'lucide-react';
import { NEURAL_INGREDIENTS, ONE_CLICK_PRESETS } from './constants';

interface NeuralGenPanelProps {
  customPrompt: string;
  isGenerating: boolean;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  onOneClick: (prompt: string) => void;
  onRandomize: () => void;
  onClose: () => void;
}

export const NeuralGenPanel: React.FC<NeuralGenPanelProps> = ({
  customPrompt,
  isGenerating,
  onPromptChange,
  onGenerate,
  onOneClick,
  onRandomize,
  onClose,
}) => {
  const appendIngredient = (text: string) => {
    onPromptChange(customPrompt.trim() ? `${customPrompt.trim()}, ${text}` : text);
  };

  return (
    <div className="w-[340px] bg-[#050505] border-l border-white/10 flex flex-col">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles className="text-indigo-500" size={18} />
          <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Neural_Gen</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close theme studio"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        <div className="space-y-3">
          {/* Prompt Textarea */}
          <div className="relative">
            <textarea
              value={customPrompt}
              onChange={e => onPromptChange(e.target.value)}
              placeholder="Describe mood, colors, atmosphere (e.g. 'Cyberpunk neon rain with metallic bezels')..."
              className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-[11px] text-white font-mono outline-none focus:border-indigo-500/50 resize-none transition-all shadow-inner"
            />
            {customPrompt && (
              <button
                onClick={() => onPromptChange('')}
                aria-label="Clear prompt text"
                className="absolute top-3 right-3 text-slate-600 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Neural Ingredients */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest px-1">
                Neural Ingredients
              </span>
              <button
                onClick={onRandomize}
                className="text-indigo-400 hover:text-white p-1 rounded-md transition-colors"
                title="Randomize"
              >
                <Dice5 size={12} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(NEURAL_INGREDIENTS).map(([_cat, items]) =>
                items.map(item => (
                  <button
                    key={item}
                    onClick={() => appendIngredient(item)}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[8px] text-slate-400 hover:text-indigo-300 transition-colors uppercase tracking-wider flex items-center gap-1 group"
                  >
                    <Plus
                      size={8}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    {item}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={onGenerate}
            disabled={isGenerating || !customPrompt.trim()}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-900/20"
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            Auto-Generate
          </button>
        </div>

        {/* One-Click Recipes */}
        <div className="space-y-3">
          <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest px-1">
            One-Click Recipes
          </span>
          <div className="flex flex-col gap-2">
            {ONE_CLICK_PRESETS.map((h, i) => (
              <button
                key={i}
                onClick={() => onOneClick(h.prompt)}
                className="px-4 py-3 bg-white/5 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 rounded-xl text-left transition-all group"
              >
                <span className="block text-[9px] font-bold text-slate-300 group-hover:text-white uppercase">
                  {h.name}
                </span>
                <span className="block text-[8px] text-slate-600 truncate mt-1">{h.prompt}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

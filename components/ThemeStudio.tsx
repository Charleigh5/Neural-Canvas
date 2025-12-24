import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { ThemeConfig } from '../types';
import {
  LoadingOverlay,
  ThemeVaultPanel,
  ConfigurationLab,
  NeuralGenPanel,
  DEFAULT_THEME_CONFIG,
  NEURAL_INGREDIENTS,
} from './theme-studio';

export const ThemeStudio: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    playback,
    toggleCaptions,
    generateCustomTheme,
    setCustomTheme,
    generateCaptionsForReel,
    neuralTemperature,
    saveTheme,
    deleteTheme,
    savedThemes,
    reel,
  } = useStore();

  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Ensure active config is always available for editing
  const activeConfig: ThemeConfig =
    playback.bezelTheme === 'custom' && playback.activeThemeConfig
      ? playback.activeThemeConfig
      : DEFAULT_THEME_CONFIG;

  // --- Event Handlers ---

  const handleGenerate = async () => {
    if (!customPrompt.trim()) return;
    setIsGenerating(true);
    try {
      await generateCustomTheme(customPrompt);
    } catch (error) {
      console.error('Theme generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOneClick = async (prompt: string) => {
    setCustomPrompt(prompt);
    setIsGenerating(true);
    try {
      await generateCustomTheme(prompt);
    } catch (error) {
      console.error('Theme generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateConfig = (updates: Partial<ThemeConfig>) => {
    const base = playback.activeThemeConfig || activeConfig;
    const newConfig = { ...base, ...updates };
    setCustomTheme(newConfig);
  };

  const handleSaveTheme = (name: string) => {
    const newTheme: ThemeConfig = {
      ...activeConfig,
      id: `user-${Date.now()}`,
      name,
    };
    saveTheme(newTheme);
  };

  const handleLoadTheme = (theme: ThemeConfig) => {
    setCustomTheme(theme);
  };

  const handleRandomize = () => {
    const rMood =
      NEURAL_INGREDIENTS.Mood[Math.floor(Math.random() * NEURAL_INGREDIENTS.Mood.length)];
    const rPalette =
      NEURAL_INGREDIENTS.Palette[Math.floor(Math.random() * NEURAL_INGREDIENTS.Palette.length)];
    const rFX = NEURAL_INGREDIENTS.FX[Math.floor(Math.random() * NEURAL_INGREDIENTS.FX.length)];
    setCustomPrompt(`${rMood} mood with ${rPalette} colors and ${rFX} effects`);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-7xl h-[85vh] bg-[#08080a] border border-white/10 rounded-3xl flex overflow-hidden shadow-2xl relative">
        {/* Global AI Processing Overlay */}
        <AnimatePresence>
          <LoadingOverlay isVisible={isGenerating} />
        </AnimatePresence>

        {/* Left: Saved Themes */}
        <ThemeVaultPanel
          savedThemes={savedThemes}
          onLoadTheme={handleLoadTheme}
          onDeleteTheme={deleteTheme}
        />

        {/* Center: Configuration Controls */}
        <ConfigurationLab
          activeConfig={activeConfig}
          showCaptions={playback.showCaptions}
          neuralTemperature={neuralTemperature}
          reelLength={reel.length}
          onUpdateConfig={handleUpdateConfig}
          onToggleCaptions={toggleCaptions}
          onGenerateCaptions={generateCaptionsForReel}
          onSaveTheme={handleSaveTheme}
        />

        {/* Right: AI Generation */}
        <NeuralGenPanel
          customPrompt={customPrompt}
          isGenerating={isGenerating}
          onPromptChange={setCustomPrompt}
          onGenerate={handleGenerate}
          onOneClick={handleOneClick}
          onRandomize={handleRandomize}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { ImageAsset, ForgeTab } from '../types';

interface UseForgeProps {
  image: ImageAsset;
  initialTab?: ForgeTab;
}

export const useForge = ({ image, initialTab = 'forge' }: UseForgeProps) => {
  const [activeTab, setActiveTab] = useState<ForgeTab>(initialTab);
  const [prompt, setPrompt] = useState(image.caption || '');
  const [command, setCommand] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Style Reference State
  const [showCanvasPicker, setShowCanvasPicker] = useState(false);
  const [styleRefBase64, setStyleRefBase64] = useState<string | null>(image.style || null);
  const [styleRefMimeType, setStyleRefMimeType] = useState<string>('image/jpeg');
  const [styleIntensity, setStyleIntensity] = useState(0.5);

  // Sync prompt with image caption if it changes externall, but only if user hasn't typed?
  // actually, usually we want to initialize from prop, so useEffect is good.
  useEffect(() => {
    if (image.caption) {
      setPrompt(image.caption);
    }
  }, [image.id, image.caption]);

  return {
    activeTab,
    setActiveTab,
    prompt,
    setPrompt,
    command,
    setCommand,
    isRefining,
    setIsRefining,
    showCanvasPicker,
    setShowCanvasPicker,
    styleRefBase64,
    setStyleRefBase64,
    styleRefMimeType,
    setStyleRefMimeType,
    styleIntensity,
    setStyleIntensity,
  };
};

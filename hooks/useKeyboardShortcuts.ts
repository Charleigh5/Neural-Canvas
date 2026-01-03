import { useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { AppMode } from '../types';

/**
 * useKeyboardShortcuts
 *
 * Global keyboard shortcut handler for Neural Canvas.
 *
 * Shortcuts:
 * - Space: Toggle playback
 * - ArrowRight: Next slide (when playing)
 * - ArrowLeft: Previous slide (placeholder)
 * - Escape: Return to Home / close modals
 * - 1-5: Switch modes
 */
export const useKeyboardShortcuts = () => {
  const { mode, setMode, playback, togglePlayback, nextSlide, ui, toggleUiPanel } = useStore();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      switch (event.key) {
        // Playback Controls
        case ' ': // Space - Toggle play/pause
          event.preventDefault();
          togglePlayback();
          break;

        case 'ArrowRight': // Next slide
          if (playback.isPlaying || mode === AppMode.PLAYER) {
            event.preventDefault();
            nextSlide();
          }
          break;

        case 'ArrowLeft': // Previous slide (future implementation)
          // Placeholder for prevSlide when implemented
          break;

        // Mode Switching
        case 'Escape':
          event.preventDefault();
          // Close any open panels first
          if (ui.isThemeStudioOpen) {
            toggleUiPanel('isThemeStudioOpen');
          } else if (ui.isInspectorOpen) {
            toggleUiPanel('isInspectorOpen');
          } else if (mode !== AppMode.HOME) {
            setMode(AppMode.HOME);
          }
          break;

        case '1': // Home
          if (event.ctrlKey || event.metaKey) return;
          setMode(AppMode.HOME);
          break;

        case '2': // Canvas
          if (event.ctrlKey || event.metaKey) return;
          setMode(AppMode.CANVAS);
          break;

        case '3': // Studio/Sequencer
          if (event.ctrlKey || event.metaKey) return;
          setMode(AppMode.STUDIO);
          break;

        case '4': // Assets
          if (event.ctrlKey || event.metaKey) return;
          setMode(AppMode.ASSETS);
          break;

        case '5': // Player
          if (event.ctrlKey || event.metaKey) return;
          setMode(AppMode.PLAYER);
          break;

        // Quick Actions
        case 'p': // Toggle playback (alternative)
          if (!event.ctrlKey && !event.metaKey) {
            togglePlayback();
          }
          break;

        case 't': // Toggle theme studio
          if (!event.ctrlKey && !event.metaKey) {
            toggleUiPanel('isThemeStudioOpen');
          }
          break;

        case 'i': // Toggle inspector
          if (!event.ctrlKey && !event.metaKey) {
            toggleUiPanel('isInspectorOpen');
          }
          break;
      }
    },
    [mode, setMode, playback.isPlaying, togglePlayback, nextSlide, ui, toggleUiPanel]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

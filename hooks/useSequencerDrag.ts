import { useState, useCallback } from 'react';
import { useStore } from '../store/useStore';

export const useSequencerDrag = () => {
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const { addImage, addToReel } = useStore();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingFile(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingFile(false);
      const files = Array.from(e.dataTransfer.files).filter((f: File) =>
        f.type.startsWith('image/')
      );

      if (files.length > 0) {
        const newIds: string[] = [];
        for (const file of files) {
          const id = Math.random().toString(36).substring(2, 11);
          newIds.push(id);
          const reader = new FileReader();
          reader.onload = async ev => {
            const src = ev.target?.result as string;
            // Create a temporary image to get dimensions
            const imgObj = new window.Image();
            imgObj.src = src;
            imgObj.onload = () => {
              addImage({
                id,
                url: src,
                file: file,
                width: 400,
                height: 400 * (imgObj.height / imgObj.width),
                x: 0,
                y: 0,
                rotation: 0,
                scale: 1,
                tags: ['sequencer_drop', 'analyzing...'],
                analyzed: false,
                timestamp: Date.now(),
                duration: 5,
              });
            };
          };
          reader.readAsDataURL(file);
        }
        addToReel(newIds);
      }
    },
    [addImage, addToReel]
  );

  return {
    isDraggingFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};

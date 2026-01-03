import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Group, Image as KonvaImage, Rect, Text } from 'react-konva';
import Konva from 'konva';
import { useImage } from '../../hooks/useImage';
import { useSelectionPulse } from '../../hooks/useSelectionPulse';
import { ImageAsset } from '../../types';

interface CanvasNodeProps {
  image: ImageAsset;
  isSelected: boolean;
  isSearchResult?: boolean;
  activeTool: 'select' | 'move' | 'erase' | 'pointer' | 'hand' | 'draw';
  onSelect: (id: string, multi: boolean) => void;
  onDblClick: (img: ImageAsset, pos: { x: number; y: number }) => void;
  onDragEnd: (id: string, pos: { x: number; y: number }) => void;
  snapFunc: (pos: { x: number; y: number }, id: string) => { x: number; y: number };
}

export const CanvasNode: React.FC<CanvasNodeProps> = React.memo(
  ({ image, isSelected, isSearchResult, activeTool, onSelect, onDblClick, onDragEnd, snapFunc }) => {
    const [img, status] = useImage(
      !image || image.isStackChild || image.mediaType === 'video' ? undefined : image.url
    );
    const [isHovered, setIsHovered] = useState(false);
    const groupRef = useRef<Konva.Group>(null);
    const imageNodeRef = useRef<Konva.Image>(null);

    // Shared selection pulse animation (single RAF loop for all nodes)
    const pulseOpacity = useSelectionPulse(isSelected || !!isSearchResult);

    // Apply Filters & Cache
    useEffect(() => {
      if (imageNodeRef.current && status === 'loaded') {
        imageNodeRef.current.cache();
      }
    }, [
      status,
      image?.brightness,
      image?.contrast,
      image?.saturation,
      image?.blur,
      image?.grayscale,
      image?.sepia,
      image?.invert,
      image?.hue,
      image?.width,
      image?.height,
    ]);

    // Filter Assembly
    const filters = useMemo(() => {
      if (!image) return [];
      const f = [
        Konva.Filters.Brighten,
        Konva.Filters.Contrast,
        Konva.Filters.HSV,
        Konva.Filters.Blur,
      ];
      if (image.grayscale) f.push(Konva.Filters.Grayscale);
      if (image.sepia) f.push(Konva.Filters.Sepia);
      if (image.invert) f.push(Konva.Filters.Invert);
      return f;
    }, [image]);

    if (!image || image.isStackChild) return null;

    const handleDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      if (groupRef.current) {
        const pos = groupRef.current.getAbsolutePosition();
        onDblClick(image, pos);
      }
    };

    return (
      <Group
        ref={groupRef}
        id={image.id}
        x={image.x}
        y={image.y}
        scaleX={image.scale}
        scaleY={image.scale}
        draggable={activeTool === 'pointer' && !image.locked}
        dragBoundFunc={pos => (snapFunc ? snapFunc(pos, image.id) : pos)}
        onClick={e => {
          e.cancelBubble = true;
          onSelect(image.id, e.evt.shiftKey);
        }}
        onDblClick={handleDblClick}
        onDragEnd={e => onDragEnd(image.id, { x: e.target.x(), y: e.target.y() })}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        opacity={isSearchResult === false ? 0.3 : 1} // Dim non-matches if explicitly false (tri-state logic used in parent)
      >
        {/* INNER ROTATOR GROUP - Handles rotation around center */}
        <Group
          x={image.width / 2}
          y={image.height / 2}
          offsetX={image.width / 2}
          offsetY={image.height / 2}
          rotation={image.rotation || 0}
        >
          {/* 1. SELECTION GLOW (PULSING) */}
          {(isSelected || isSearchResult) && (
            <Rect
              x={-15}
              y={-15}
              width={image.width + 30}
              height={image.height + 30}
              fillRadialGradientStartPoint={{ x: image.width / 2 + 15, y: image.height / 2 + 15 }}
              fillRadialGradientStartRadius={0}
              fillRadialGradientEndPoint={{ x: image.width / 2 + 15, y: image.height / 2 + 15 }}
              fillRadialGradientEndRadius={image.width}
              fillRadialGradientColorStops={[
                0, 
                isSearchResult ? 'rgba(16, 185, 129, 0.4)' : 'rgba(99, 102, 241, 0.4)', // Emerald for search, Indigo for select
                1, 
                'transparent'
              ]}
              cornerRadius={12}
              opacity={pulseOpacity}
            />
          )}

          {/* 2. MAIN BEZEL / BACKGROUND */}
          <Rect
            x={-6}
            y={-6}
            width={image.width + 12}
            height={image.height + 12}
            fill="#000"
            stroke={
              isSearchResult
                ? '#10b981' // Emerald-500
                : isSelected
                  ? '#6366f1' // Indigo-500
                  : isHovered
                    ? 'rgba(255,255,255,0.4)'
                    : 'rgba(255,255,255,0.1)'
            }
            strokeWidth={isSearchResult || isSelected ? 3 : 1}
            shadowBlur={isSelected || isSearchResult ? 15 : 0}
            shadowColor={isSearchResult ? '#10b981' : '#6366f1'}
            cornerRadius={10}
          />

          {/* 3. INNER CONTENT SEPARATOR */}
          {isSelected && (
            <Rect
              x={-2}
              y={-2}
              width={image.width + 4}
              height={image.height + 4}
              stroke="#fff"
              strokeWidth={0.5}
              opacity={0.8}
              cornerRadius={6}
            />
          )}

          {/* 4. THE IMAGE */}
          <KonvaImage
            ref={imageNodeRef}
            image={img}
            width={image.width}
            height={image.height}
            cornerRadius={4}
            opacity={status === 'loaded' ? (image.opacity ?? 1) : 0.2}
            filters={filters}
            brightness={image.brightness || 0}
            contrast={image.contrast || 0}
            blurRadius={image.blur || 0}
            saturation={image.saturation || 0}
            value={0}
            hue={image.hue || 0}
          />

          {/* 5. LOADING STATE INDICATOR */}
          {status === 'loading' && (
            <Rect
              x={0}
              y={0}
              width={image.width}
              height={image.height}
              fill="rgba(255,255,255,0.05)"
              cornerRadius={4}
            />
          )}

          {/* 6. NEURAL DNA TAG (ONLY ON SELECT) */}
          {isSelected && image.primaryTag && (
            <Group x={0} y={image.height + 15}>
              <Rect
                width={120}
                height={20}
                fill="rgba(99, 102, 241, 0.9)"
                cornerRadius={4}
                x={(image.width - 120) / 2}
              />
              <Text
                text={image.primaryTag.toUpperCase()}
                fontSize={8}
                fontFamily="monospace"
                fill="#fff"
                align="center"
                width={120}
                y={6}
                x={(image.width - 120) / 2}
                listening={false}
              />
            </Group>
          )}
        </Group>
      </Group>
    );
  }
);

CanvasNode.displayName = 'CanvasNode';

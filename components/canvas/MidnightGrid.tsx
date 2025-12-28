import React from 'react';
import { Shape } from 'react-konva';

const GRID_SIZE = 100;

export const MidnightGrid = React.memo(function MidnightGrid({
  scale,
  x,
  y,
  width,
  height,
  isInteracting,
}: any) {
  return (
    <Shape
      x={0}
      y={0}
      width={width}
      height={height}
      listening={false}
      perfectDrawEnabled={false}
      sceneFunc={ctx => {
        if (scale < 0.1 && isInteracting) return;
        const worldRect = {
          x1: -x / scale,
          y1: -y / scale,
          x2: (-x + width) / scale,
          y2: (-y + height) / scale,
        };
        const startX = Math.floor(worldRect.x1 / GRID_SIZE) * GRID_SIZE;
        const endX = Math.ceil(worldRect.x2 / GRID_SIZE) * GRID_SIZE;
        const startY = Math.floor(worldRect.y1 / GRID_SIZE) * GRID_SIZE;
        const endY = Math.ceil(worldRect.y2 / GRID_SIZE) * GRID_SIZE;
        if (scale > 0.1) {
          ctx.beginPath();
          const step = isInteracting ? GRID_SIZE * 4 : GRID_SIZE;
          for (let lx = startX; lx <= endX; lx += step)
            if (lx % 1000 !== 0) {
              ctx.moveTo(lx, worldRect.y1);
              ctx.lineTo(lx, worldRect.y2);
            }
          for (let ly = startY; ly <= endY; ly += step)
            if (ly % 1000 !== 0) {
              ctx.moveTo(worldRect.x1, ly);
              ctx.lineTo(worldRect.x2, ly);
            }
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = 1 / scale;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(worldRect.x1, 0);
        ctx.lineTo(worldRect.x2, 0);
        ctx.moveTo(0, worldRect.y1);
        ctx.lineTo(0, worldRect.y2);
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2 / scale;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
      }}
    />
  );
});

MidnightGrid.displayName = 'MidnightGrid';

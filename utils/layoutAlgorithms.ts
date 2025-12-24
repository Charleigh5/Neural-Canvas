
import { ImageAsset } from '../types';

/**
 * Finds the next available non-overlapping quadrant on the grid.
 * Uses a center-out spiral search pattern to ensure new images
 * are always injected into the user's primary field of view.
 */
export const findAvailableGridPosition = (
  newWidth: number,
  newHeight: number,
  existingImages: ImageAsset[],
  viewport: { x1: number; y1: number; x2: number; y2: number },
  padding: number = 40,
  gridSize: number = 100
): { x: number; y: number } => {
  const cellW = Math.ceil((newWidth + padding) / gridSize) * gridSize;
  const cellH = Math.ceil((newHeight + padding) / gridSize) * gridSize;

  // Calculate Visual Center
  const centerX = Math.floor((viewport.x1 + viewport.x2) / 2 / gridSize) * gridSize;
  const centerY = Math.floor((viewport.y1 + viewport.y2) / 2 / gridSize) * gridSize;

  let currentX = centerX;
  let currentY = centerY;

  const maxAttempts = 200;
  let attempts = 0;
  
  // Spiral variables
  let dx = gridSize;
  let dy = 0;
  let segmentLength = 1;
  let segmentPassed = 0;

  while (attempts < maxAttempts) {
    const candidateRect = {
      left: currentX,
      top: currentY,
      right: currentX + cellW - padding,
      bottom: currentY + cellH - padding
    };

    const hasCollision = existingImages.some(img => {
      if (img.isStackChild) return false;
      const imgW = img.width * img.scale;
      const imgH = img.height * img.scale;
      const existingRect = {
        left: img.x,
        top: img.y,
        right: img.x + imgW,
        bottom: img.y + imgH
      };

      return !(
        candidateRect.right <= existingRect.left ||
        candidateRect.left >= existingRect.right ||
        candidateRect.bottom <= existingRect.top ||
        candidateRect.top >= existingRect.bottom
      );
    });

    if (!hasCollision) {
      return { x: currentX + (padding / 2), y: currentY + (padding / 2) };
    }

    // Spiral Step
    currentX += dx;
    currentY += dy;
    segmentPassed++;
    
    if (segmentPassed === segmentLength) {
      segmentPassed = 0;
      // Rotate 90 degrees
      const buffer = dx;
      dx = -dy;
      dy = buffer;
      
      if (dy === 0) {
        segmentLength++;
      }
    }
    attempts++;
  }

  // Fallback to center if spiral fails (rare)
  return { x: centerX, y: centerY };
};

/**
 * THE ZERO-OVERLAP PROTOCOL (Physics Engine)
 * Uses a basic spring-repulsion loop to push nodes away from each other.
 */
export const resolveCollisions = (images: ImageAsset[]): ImageAsset[] => {
  const K = 0.15; // Spring repulsion force
  const PADDING = 30;
  const nextImages = images.map(img => ({ ...img }));

  for (let i = 0; i < nextImages.length; i++) {
    for (let j = i + 1; j < nextImages.length; j++) {
      const a = nextImages[i];
      const b = nextImages[j];
      
      if (a.isStackChild || b.isStackChild || a.pinned || b.pinned) continue;

      const rA = { x: a.x, y: a.y, w: a.width * a.scale, h: a.height * a.scale };
      const rB = { x: b.x, y: b.y, w: b.width * b.scale, h: b.height * b.scale };

      const overlapX = Math.min(rA.x + rA.w, rB.x + rB.w) - Math.max(rA.x, rB.x);
      const overlapY = Math.min(rA.y + rA.h, rB.y + rB.h) - Math.max(rA.y, rB.y);

      // If they overlap with padding
      if (overlapX > -PADDING && overlapY > -PADDING) {
        const dx = (rA.x + rA.w / 2) - (rB.x + rB.w / 2);
        const dy = (rA.y + rA.h / 2) - (rB.y + rB.h / 2);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Calculate repulsion force
        const forceX = (dx / dist) * K * 10;
        const forceY = (dy / dist) * K * 10;

        a.x += forceX;
        a.y += forceY;
        b.x -= forceX;
        b.y -= forceY;
      }
    }
  }
  return nextImages;
};

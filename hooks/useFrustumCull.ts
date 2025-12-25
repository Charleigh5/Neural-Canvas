import { useMemo } from 'react';

interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

interface CullableItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

/**
 * useFrustumCull - Performance optimization hook for infinite canvas
 *
 * Filters items to only those visible within the current viewport,
 * plus a configurable buffer zone to reduce pop-in during fast panning.
 *
 * @param items - All canvas items
 * @param viewport - Current viewport position, size, and scale
 * @param buffer - Extra pixels around viewport to include (default 500)
 * @returns Subset of items that intersect the buffered viewport
 */
export function useFrustumCull<T extends CullableItem>(
  items: T[],
  viewport: ViewportBounds,
  buffer: number = 500
): T[] {
  return useMemo(() => {
    const { x: vpX, y: vpY, width: vpWidth, height: vpHeight, scale } = viewport;

    // Convert viewport to world coordinates
    // The viewport position (vpX, vpY) is the stage's offset in screen space
    // We need to find the world-space bounds of what's visible
    const worldLeft = -vpX / scale - buffer;
    const worldTop = -vpY / scale - buffer;
    const worldRight = (-vpX + vpWidth) / scale + buffer;
    const worldBottom = (-vpY + vpHeight) / scale + buffer;

    return items.filter(item => {
      const itemWidth = item.width * item.scale;
      const itemHeight = item.height * item.scale;

      const itemRight = item.x + itemWidth;
      const itemBottom = item.y + itemHeight;

      // AABB intersection test
      return !(
        item.x > worldRight ||
        itemRight < worldLeft ||
        item.y > worldBottom ||
        itemBottom < worldTop
      );
    });
  }, [items, viewport, buffer]);
}

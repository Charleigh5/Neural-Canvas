/**
 * useFrustumCull Hook Tests
 * Tests viewport culling logic for performance optimization
 */
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFrustumCull } from '../hooks/useFrustumCull';

interface TestItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

const createItem = (id: string, x: number, y: number, size = 100): TestItem => ({
  id,
  x,
  y,
  width: size,
  height: size,
  scale: 1,
});

describe('useFrustumCull', () => {
  const defaultViewport = {
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
    scale: 1,
  };

  it('should return items within viewport', () => {
    const items = [createItem('visible', 500, 400), createItem('also-visible', 800, 600)];

    const { result } = renderHook(() => useFrustumCull(items, defaultViewport, 100));

    expect(result.current).toHaveLength(2);
    expect(result.current.map(i => i.id)).toContain('visible');
    expect(result.current.map(i => i.id)).toContain('also-visible');
  });

  it('should exclude items far outside viewport', () => {
    const items = [
      createItem('visible', 500, 400),
      createItem('far-right', 5000, 400),
      createItem('far-bottom', 500, 5000),
    ];

    const { result } = renderHook(() => useFrustumCull(items, defaultViewport, 100));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe('visible');
  });

  it('should include items within buffer zone', () => {
    const items = [
      createItem('edge-item', -400, 400), // Just outside viewport but within 500px buffer
    ];

    const { result } = renderHook(() => useFrustumCull(items, defaultViewport, 500));

    expect(result.current).toHaveLength(1);
  });

  it('should handle zoomed viewport correctly', () => {
    const zoomedViewport = { ...defaultViewport, scale: 0.5 };
    const items = [
      createItem('visible-zoomed', 2000, 2000), // Would be visible when zoomed out
    ];

    const { result } = renderHook(() => useFrustumCull(items, zoomedViewport, 100));

    // At 0.5 scale, the world bounds are 2x larger
    expect(result.current).toHaveLength(1);
  });

  it('should handle pan offset correctly', () => {
    // When viewport is panned by (-500, -500), visible world starts at 500,500
    const pannedViewport = { ...defaultViewport, x: -500, y: -500 };
    const items = [createItem('origin', 0, 0), createItem('shifted', 500, 500)];

    const { result } = renderHook(() => useFrustumCull(items, pannedViewport, 100));

    // With pan offset, origin at (0,0) is outside visible area
    // Only 'shifted' at (500,500) should be visible
    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe('shifted');
  });

  it('should return empty array for empty items', () => {
    const { result } = renderHook(() => useFrustumCull([], defaultViewport, 100));

    expect(result.current).toHaveLength(0);
  });

  it('should handle items with different scales', () => {
    const items = [
      { ...createItem('large', 500, 400), scale: 2 }, // 200x200 effective size
      { ...createItem('small', 600, 500), scale: 0.5 }, // 50x50 effective size
    ];

    const { result } = renderHook(() => useFrustumCull(items, defaultViewport, 100));

    expect(result.current).toHaveLength(2);
  });
});

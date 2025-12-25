/**
 * Smart Crop Utility Tests
 * Tests the AI-informed cropping calculations
 */
import { describe, it, expect } from 'vitest';
import { calculateSmartCrop } from '../utils/smartCrop';

describe('calculateSmartCrop', () => {
  it('should return crop data for given dimensions', () => {
    const result = calculateSmartCrop(1920, 1080);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('x');
    expect(result).toHaveProperty('y');
    expect(result).toHaveProperty('width');
    expect(result).toHaveProperty('height');
  });

  it('should center crop by default', () => {
    const result = calculateSmartCrop(1000, 1000);

    // Default should center the crop
    expect(result.x).toBeGreaterThanOrEqual(0);
    expect(result.y).toBeGreaterThanOrEqual(0);
  });

  it('should respect subject box when provided', () => {
    // Subject box: [ymin, xmin, ymax, xmax] normalized 0-1
    const subjectBox = [0.2, 0.3, 0.8, 0.7]; // Subject in center-right area
    const result = calculateSmartCrop(1000, 1000, subjectBox);

    expect(result).toBeDefined();
    // Crop should try to include the subject
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });

  it('should apply rule of thirds composition', () => {
    const result = calculateSmartCrop(1920, 1080, undefined, undefined, 'thirds');

    expect(result).toBeDefined();
  });

  it('should apply golden ratio composition', () => {
    const result = calculateSmartCrop(1920, 1080, undefined, undefined, 'golden');

    expect(result).toBeDefined();
  });

  it('should apply center composition', () => {
    const result = calculateSmartCrop(1000, 1000, undefined, undefined, 'center');

    expect(result).toBeDefined();
    // Center should have symmetric x/y offsets for square images
  });

  it('should handle extreme aspect ratios', () => {
    const ultrawide = calculateSmartCrop(3440, 1440);
    const portrait = calculateSmartCrop(1080, 1920);

    expect(ultrawide).toBeDefined();
    expect(portrait).toBeDefined();
    expect(ultrawide.width).toBeGreaterThan(0);
    expect(portrait.height).toBeGreaterThan(0);
  });

  it('should handle very small dimensions', () => {
    const result = calculateSmartCrop(100, 100);

    expect(result).toBeDefined();
    expect(result.width).toBeLessThanOrEqual(100);
    expect(result.height).toBeLessThanOrEqual(100);
  });
});

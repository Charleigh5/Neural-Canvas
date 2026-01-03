import { describe, it, expect, beforeEach } from 'vitest';
import { OrchestratorEngine } from '../engine/Orchestrator';
import { ImageAsset } from '../types';

describe('OrchestratorEngine', () => {
  let engine: OrchestratorEngine;
  const mockImages: ImageAsset[] = [
    { id: '1', url: '', width: 100, height: 100, tags: ['nature'], analyzed: true, timestamp: 0, x: 0, y: 0, rotation: 0, scale: 1 },
    { id: '2', url: '', width: 100, height: 100, tags: ['nature', 'water'], analyzed: true, timestamp: 0, x: 0, y: 0, rotation: 0, scale: 1 },
    { id: '3', url: '', width: 100, height: 100, tags: ['city'], analyzed: true, timestamp: 0, x: 0, y: 0, rotation: 0, scale: 1 },
  ];

  beforeEach(() => {
    engine = new OrchestratorEngine();
  });

  it('should initialize with empty state', () => {
    expect(engine.currentImageId).toBeNull();
    expect(engine.nextImageId).toBeNull();
    expect(engine.history).toEqual([]);
    expect(engine.queue).toEqual([]);
  });

  it('should add to queue', () => {
    engine.addToQueue('test-id');
    expect(engine.queue).toContain('test-id');
  });

  it('should advance when nextImageId is set', () => {
    engine.nextImageId = 'img-1';
    const success = engine.advance();
    expect(success).toBe(true);
    expect(engine.currentImageId).toBe('img-1');
    expect(engine.nextImageId).toBeNull();
    expect(engine.history).toContain('img-1');
  });

  it('should not advance when nextImageId is null', () => {
    const success = engine.advance();
    expect(success).toBe(false);
    expect(engine.currentImageId).toBeNull();
  });

  it('should prepare next from queue first', async () => {
    engine.addToQueue('queued-id');
    await engine.prepareNext(mockImages, 'sequential');
    expect(engine.nextImageId).toBe('queued-id');
    expect(engine.queue).toHaveLength(0);
  });

  it('should handle sequential mode correctly', async () => {
    engine.currentImageId = '1';
    await engine.prepareNext(mockImages, 'sequential');
    expect(engine.nextImageId).toBe('2');
    
    engine.advance(); // current becomes 2
    await engine.prepareNext(mockImages, 'sequential');
    expect(engine.nextImageId).toBe('3');

    engine.advance(); // current becomes 3
    await engine.prepareNext(mockImages, 'sequential');
    expect(engine.nextImageId).toBe('1'); // Loops back
  });

  it('should register history correctly', () => {
    // history is private but currentImageId and advance use it
    engine.nextImageId = '1';
    engine.advance();
    expect(engine.currentImageId).toBe('1');
    expect(engine.history).toEqual(['1']);
  });

  it('should cap history at 50 items', () => {
    for (let i = 0; i < 60; i++) {
        engine.nextImageId = `${i}`;
        engine.advance();
    }
    expect(engine.history).toHaveLength(50);
    expect(engine.history[0]).toBe('10');
  });
});

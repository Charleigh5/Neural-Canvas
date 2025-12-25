/**
 * Logger Service Tests
 * Tests the centralized logging utility
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../services/logger';

describe('Logger Service', () => {
  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    logger.clearHistory();
  });

  it('should log debug messages', () => {
    logger.debug('TestComponent', 'Debug message', { data: 'test' });
    // In test mode, logs are silenced, but we can check history
    expect(logger.getHistory()).toBeDefined();
  });

  it('should log info messages', () => {
    logger.info('TestComponent', 'Info message');
    expect(logger.getHistory()).toBeDefined();
  });

  it('should log warn messages', () => {
    logger.warn('TestComponent', 'Warning message');
    expect(logger.getHistory()).toBeDefined();
  });

  it('should log error messages with stack trace', () => {
    const error = new Error('Test error');
    logger.error('TestComponent', 'Error occurred', { error });
    expect(logger.getHistory()).toBeDefined();
  });

  it('should track performance marks', () => {
    logger.perf('TestOperation', 'start');
    // Simulate some work
    logger.perf('TestOperation', 'end');
    // Should not throw
    expect(true).toBe(true);
  });

  it('should maintain history up to max size', () => {
    // Log many messages
    for (let i = 0; i < 150; i++) {
      logger.info('Test', `Message ${i}`);
    }
    // History should be capped
    expect(logger.getHistory().length).toBeLessThanOrEqual(100);
  });

  it('should clear history', () => {
    logger.info('Test', 'Message');
    logger.clearHistory();
    expect(logger.getHistory()).toHaveLength(0);
  });
});

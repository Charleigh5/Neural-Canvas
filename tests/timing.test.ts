/**
 * Timing Utilities Tests
 * Tests for debounce and throttle functions
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, throttle } from '../utils/timing';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should delay execution until after delay period', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn('arg1');
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('arg1');
  });

  it('should reset timer on subsequent calls', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn('call1');
    vi.advanceTimersByTime(200);

    debouncedFn('call2');
    vi.advanceTimersByTime(200);

    debouncedFn('call3');
    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('call3');
  });

  it('should support cancel method', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn('arg1');
    vi.advanceTimersByTime(100);

    debouncedFn.cancel();
    vi.advanceTimersByTime(300);

    expect(fn).not.toHaveBeenCalled();
  });

  it('should pass multiple arguments correctly', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('a', 'b', 'c');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('a', 'b', 'c');
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute immediately on first call', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn('arg1');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('arg1');
  });

  it('should prevent execution within limit period', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn('call1');
    throttledFn('call2');
    throttledFn('call3');

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('call1');
  });

  it('should execute trailing call after limit', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn('call1');
    throttledFn('call2');
    throttledFn('call3');

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('call3');
  });

  it('should allow execution after limit period', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn('call1');
    vi.advanceTimersByTime(100);

    throttledFn('call2');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should support cancel method', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn('call1');
    throttledFn('call2'); // Scheduled as trailing

    throttledFn.cancel();
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('call1');
  });
});

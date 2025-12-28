/**
 * timing.ts - Debounce and Throttle Utilities
 *
 * Debounce: Delays execution until N ms after last call
 * Throttle: Executes at most once per N ms
 */

/**
 * Creates a debounced version of a function.
 * The debounced function delays invoking `fn` until after `delay` ms
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function with a `cancel` method
 *
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   fetchResults(query);
 * }, 300);
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Creates a throttled version of a function.
 * The throttled function invokes `fn` at most once per `limit` ms.
 * Trailing calls are executed after the limit period.
 *
 * @param fn - The function to throttle
 * @param limit - Minimum time between invocations in milliseconds
 * @returns Throttled function with a `cancel` method
 *
 * @example
 * const throttledUpdate = throttle((value: number) => {
 *   updateSlider(value);
 * }, 50);
 */
export function throttle<T extends (...args: Parameters<T>) => void>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLast = now - lastCall;

    if (timeSinceLast >= limit) {
      // Enough time has passed, execute immediately
      lastCall = now;
      fn(...args);
    } else {
      // Schedule trailing call
      lastArgs = args;
      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          lastCall = Date.now();
          if (lastArgs) {
            fn(...(lastArgs as Parameters<T>));
          }
          timeoutId = null;
          lastArgs = null;
        }, limit - timeSinceLast);
      }
    }
  };

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  return throttled;
}

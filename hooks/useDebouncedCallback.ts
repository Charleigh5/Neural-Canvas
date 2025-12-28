import { useCallback, useRef, useEffect } from 'react';

/**
 * useDebouncedCallback - Returns a stable debounced function reference.
 *
 * The returned function delays invoking `callback` until after `delay` ms
 * have elapsed since the last time it was invoked.
 *
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns A stable debounced callback
 *
 * @example
 * const debouncedSave = useDebouncedCallback((data: FormData) => {
 *   saveToServer(data);
 * }, 500);
 *
 * <button onClick={() => debouncedSave(formData)}>Save</button>
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const callbackRef = useRef<T>(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

/**
 * useThrottledCallback - Returns a stable throttled function reference.
 *
 * The returned function invokes `callback` at most once per `limit` ms.
 *
 * @param callback - The function to throttle
 * @param limit - Minimum time between invocations in milliseconds
 * @returns A stable throttled callback
 *
 * @example
 * const throttledUpdate = useThrottledCallback((value: number) => {
 *   updateSlider(value);
 * }, 50);
 *
 * <Slider onChange={throttledUpdate} />
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useThrottledCallback<T extends (...args: any[]) => void>(
  callback: T,
  limit: number
): (...args: Parameters<T>) => void {
  const callbackRef = useRef<T>(callback);
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLast = now - lastCallRef.current;

      if (timeSinceLast >= limit) {
        lastCallRef.current = now;
        callbackRef.current(...args);
      } else {
        lastArgsRef.current = args;
        if (!timeoutRef.current) {
          timeoutRef.current = setTimeout(() => {
            lastCallRef.current = Date.now();
            if (lastArgsRef.current) {
              callbackRef.current(...lastArgsRef.current);
            }
            timeoutRef.current = null;
            lastArgsRef.current = null;
          }, limit - timeSinceLast);
        }
      }
    },
    [limit]
  );
}

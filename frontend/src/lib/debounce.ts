/**
 * Timing utilities for rate-limiting user-initiated actions.
 *
 * @module debounce
 */

/**
 * Debounce a function: delays invocation until `ms` milliseconds have
 * elapsed since the last call. Returns a wrapped function with a `.cancel()`
 * method for cleanup in `useEffect` teardown.
 *
 * @typeParam T - The function signature to debounce.
 * @param fn - The function to debounce.
 * @param ms - The debounce delay in milliseconds.
 * @returns A debounced wrapper with a `.cancel()` method.
 *
 * @example
 * ```ts
 * const save = debounce(() => api.save(), 300);
 * save();       // Queued
 * save.cancel(); // Cancelled
 * ```
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number,
): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: unknown[]) => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, ms);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced;
}

/**
 * Throttle a function: ensures it is invoked at most once every `ms`
 * milliseconds, dropping intermediate calls.
 *
 * @typeParam T - The function signature to throttle.
 * @param fn - The function to throttle.
 * @param ms - The minimum interval between invocations in milliseconds.
 * @returns A throttled wrapper.
 */
export function throttle<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let last = 0;
  return ((...args: unknown[]) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  }) as T;
}

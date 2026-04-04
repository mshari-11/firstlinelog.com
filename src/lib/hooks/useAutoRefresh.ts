/**
 * useAutoRefresh — polls a callback at a configurable interval
 * Pauses when the tab is hidden, resumes when visible
 */
import { useEffect, useRef, useCallback } from "react";

interface Options {
  /** Interval in milliseconds (default: 30000 = 30s) */
  interval?: number;
  /** Whether auto-refresh is enabled (default: true) */
  enabled?: boolean;
}

export function useAutoRefresh(
  callback: () => void | Promise<void>,
  options: Options = {},
) {
  const { interval = 30_000, enabled = true } = options;
  const savedCallback = useRef(callback);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep callback ref fresh
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const start = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      savedCallback.current();
    }, interval);
  }, [interval]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }

    start();

    // Pause when tab hidden, resume when visible
    function handleVisibility() {
      if (document.hidden) {
        stop();
      } else {
        savedCallback.current(); // Refresh immediately on tab focus
        start();
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, start, stop]);

  return { start, stop };
}

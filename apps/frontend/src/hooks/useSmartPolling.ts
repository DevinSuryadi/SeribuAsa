import { useEffect, useRef, useCallback } from "react";

interface SmartPollingOptions {
  interval?: number;
  enabled?: boolean;
  onVisible?: boolean;
}

export function useSmartPolling(
  callback: () => void | Promise<void>,
  options: SmartPollingOptions = {}
) {
  const { interval = 30000, enabled = true, onVisible = true } = options;
  const savedCallback = useRef(callback);
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTabVisible = useRef(!document.hidden);

  // Update ref when callback changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const execute = useCallback(async () => {
    try {
      await savedCallback.current();
    } catch (error) {
      console.error("[useSmartPolling] Error executing callback:", error);
    }
  }, []);

  const scheduleNext = useCallback(function scheduleNextInner() {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }

    if (!enabled) return;

    // Only pause if onVisible is true and tab is hidden
    if (onVisible && !isTabVisible.current) {
      // It will resume when tab becomes visible
      return;
    }

    timeoutId.current = setTimeout(async () => {
      await execute();
      scheduleNextInner(); // Recursive scheduling
    }, interval);
  }, [enabled, interval, onVisible, execute]);

  // Handle visibility change
  useEffect(() => {
    if (!onVisible) return;

    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      isTabVisible.current = isVisible;

      if (isVisible && enabled) {
        // Tab just became visible, execute immediately and resume polling
        execute().then(() => scheduleNext());
      } else if (!isVisible && timeoutId.current) {
        // Tab hidden, clear current timeout to pause
        clearTimeout(timeoutId.current);
        timeoutId.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, onVisible, execute, scheduleNext]);

  // Main polling lifecycle
  useEffect(() => {
    if (enabled && isTabVisible.current) {
      scheduleNext();
    }

    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, [enabled, scheduleNext]);

  return { execute };
}

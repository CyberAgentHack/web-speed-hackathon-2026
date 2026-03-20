import { useRef, useCallback, useEffect } from "react";

export function useThrottleCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
): T {
  const lastCalledRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCalledRef.current;

      if (timeSinceLastCall >= delay) {
        callback(...args);
        lastCalledRef.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastCalledRef.current = Date.now();
        }, delay - timeSinceLastCall);
      }
    },
    [callback, delay],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback as T;
}

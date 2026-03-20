import { useCallback, useEffect, useState } from "react";

interface ReturnValues {
  allowNow: () => void;
  canLoad: boolean;
}

export function useAfterLcp(): ReturnValues {
  const [canLoad, setCanLoad] = useState(false);

  const allowNow = useCallback(() => {
    setCanLoad(true);
  }, []);

  useEffect(() => {
    if (canLoad) {
      return;
    }

    const idleWindow = window as Window & {
      cancelIdleCallback?: (id: number) => void;
      requestIdleCallback?: (callback: () => void) => number;
    };
    let idleId: number | null = null;
    let settleTimeoutId: number | null = null;
    let fallbackTimeoutId: number | null = null;
    let lcpObserver: PerformanceObserver | null = null;

    const clearScheduledLoad = () => {
      if (idleId !== null) {
        idleWindow.cancelIdleCallback?.(idleId);
        idleId = null;
      }
    };

    const scheduleLoad = () => {
      clearScheduledLoad();

      const enable = () => {
        setCanLoad(true);
      };

      if (idleWindow.requestIdleCallback != null) {
        idleId = idleWindow.requestIdleCallback(enable);
        return;
      }

      idleId = window.setTimeout(enable, 0);
    };

    const rescheduleAfterQuietWindow = () => {
      if (document.readyState !== "complete") {
        return;
      }

      if (settleTimeoutId !== null) {
        window.clearTimeout(settleTimeoutId);
      }
      settleTimeoutId = window.setTimeout(scheduleLoad, 500);
    };

    const handleLoad = () => {
      rescheduleAfterQuietWindow();
    };

    window.addEventListener("load", handleLoad);

    if (typeof PerformanceObserver !== "undefined") {
      try {
        lcpObserver = new PerformanceObserver((entryList) => {
          if (entryList.getEntries().length === 0) {
            return;
          }
          rescheduleAfterQuietWindow();
        });
        lcpObserver.observe({ buffered: true, type: "largest-contentful-paint" });
      } catch {
        lcpObserver = null;
      }
    }

    if (document.readyState === "complete") {
      rescheduleAfterQuietWindow();
    } else {
      fallbackTimeoutId = window.setTimeout(scheduleLoad, 5_000);
    }

    return () => {
      window.removeEventListener("load", handleLoad);
      clearScheduledLoad();
      lcpObserver?.disconnect();
      if (settleTimeoutId !== null) {
        window.clearTimeout(settleTimeoutId);
      }
      if (fallbackTimeoutId !== null) {
        window.clearTimeout(fallbackTimeoutId);
      }
    };
  }, [canLoad]);

  return { allowNow, canLoad };
}

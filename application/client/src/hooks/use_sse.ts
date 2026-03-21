import { useCallback, useRef, useState } from "react";

interface SSEOptions<T> {
  onMessage: (data: T, prevContent: string) => string;
  onDone?: (data: T) => boolean;
  onComplete?: (finalContent: string) => void;
}

interface ReturnValues {
  content: string;
  isStreaming: boolean;
  start: (url: string) => void;
  stop: () => void;
  reset: () => void;
}

export function useSSE<T>(options: SSEOptions<T>): ReturnValues {
  const [content, setContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const contentRef = useRef("");
  const flushTimerIdRef = useRef<number | null>(null);
  const lastFlushAtRef = useRef(0);

  const flushContent = useCallback(
    (force: boolean) => {
      const now = performance.now();
      if (!force && now - lastFlushAtRef.current < 120) {
        return;
      }

      lastFlushAtRef.current = now;
      setContent(contentRef.current);
    },
    [setContent],
  );

  const scheduleFlush = useCallback(() => {
    if (flushTimerIdRef.current !== null) {
      return;
    }

    flushTimerIdRef.current = window.setTimeout(() => {
      flushTimerIdRef.current = null;
      flushContent(true);
    }, 120);
  }, [flushContent]);

  const stop = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (flushTimerIdRef.current !== null) {
      window.clearTimeout(flushTimerIdRef.current);
      flushTimerIdRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setContent("");
    contentRef.current = "";
  }, [stop]);

  const start = useCallback(
    (url: string) => {
      stop();
      contentRef.current = "";
      lastFlushAtRef.current = 0;
      setContent("");
      setIsStreaming(true);

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data) as T;

        const isDone = options.onDone?.(data) ?? false;
        if (isDone) {
          flushContent(true);
          options.onComplete?.(contentRef.current);
          stop();
          return;
        }

        const newContent = options.onMessage(data, contentRef.current);
        contentRef.current = newContent;
        flushContent(false);
        scheduleFlush();
      };

      eventSource.onerror = (error) => {
        console.error("SSE Error:", error);
        stop();
      };
    },
    [flushContent, options, scheduleFlush, stop],
  );

  return { content, isStreaming, start, stop, reset };
}

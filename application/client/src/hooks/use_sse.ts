import { useCallback, useRef, useState } from "react";

const DEFAULT_THROTTLE_MS = 200;

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
  const lastFlushedAtRef = useRef(0);
  const flushTimerRef = useRef<number | null>(null);

  const clearFlushTimer = useCallback(() => {
    if (flushTimerRef.current !== null) {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  }, []);

  const flushContent = useCallback(() => {
    clearFlushTimer();
    lastFlushedAtRef.current = Date.now();
    setContent(contentRef.current);
  }, [clearFlushTimer]);

  const scheduleFlush = useCallback(() => {
    const now = Date.now();
    const elapsed = now - lastFlushedAtRef.current;
    if (elapsed >= DEFAULT_THROTTLE_MS) {
      flushContent();
      return;
    }

    if (flushTimerRef.current !== null) {
      return;
    }

    flushTimerRef.current = window.setTimeout(() => {
      flushContent();
    }, DEFAULT_THROTTLE_MS - elapsed);
  }, [flushContent]);

  const stop = useCallback(() => {
    clearFlushTimer();
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  }, [clearFlushTimer]);

  const reset = useCallback(() => {
    stop();
    lastFlushedAtRef.current = 0;
    setContent("");
    contentRef.current = "";
  }, [stop]);

  const start = useCallback(
    (url: string) => {
      stop();
      lastFlushedAtRef.current = 0;
      contentRef.current = "";
      setContent("");
      setIsStreaming(true);

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data) as T;

        const isDone = options.onDone?.(data) ?? false;
        if (isDone) {
          flushContent();
          options.onComplete?.(contentRef.current);
          stop();
          return;
        }

        const newContent = options.onMessage(data, contentRef.current);
        contentRef.current = newContent;
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

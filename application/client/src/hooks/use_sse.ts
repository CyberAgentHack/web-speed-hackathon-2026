import { useCallback, useRef, useState } from "react";

const FLUSH_INTERVAL_MS = 150;

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
  const lastFlushTimeRef = useRef(0);
  const throttleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPendingFlush = useCallback(() => {
    if (throttleTimeoutRef.current !== null) {
      clearTimeout(throttleTimeoutRef.current);
      throttleTimeoutRef.current = null;
    }
  }, []);

  const flushContentToState = useCallback(() => {
    cancelPendingFlush();
    lastFlushTimeRef.current = Date.now();
    setContent(contentRef.current);
  }, [cancelPendingFlush]);

  const scheduleContentFlush = useCallback(() => {
    const now = Date.now();
    const elapsed = now - lastFlushTimeRef.current;
    if (elapsed >= FLUSH_INTERVAL_MS) {
      lastFlushTimeRef.current = now;
      setContent(contentRef.current);
      cancelPendingFlush();
      return;
    }
    if (throttleTimeoutRef.current !== null) return;
    throttleTimeoutRef.current = setTimeout(() => {
      throttleTimeoutRef.current = null;
      lastFlushTimeRef.current = Date.now();
      setContent(contentRef.current);
    }, FLUSH_INTERVAL_MS - elapsed);
  }, [cancelPendingFlush]);

  const stop = useCallback(() => {
    cancelPendingFlush();
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  }, [cancelPendingFlush]);

  const reset = useCallback(() => {
    stop();
    setContent("");
    contentRef.current = "";
    lastFlushTimeRef.current = 0;
  }, [stop]);

  const start = useCallback(
    (url: string) => {
      stop();
      contentRef.current = "";
      setContent("");
      lastFlushTimeRef.current = 0;
      setIsStreaming(true);

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data) as T;

        const isDone = options.onDone?.(data) ?? false;
        if (isDone) {
          flushContentToState();
          options.onComplete?.(contentRef.current);
          stop();
          return;
        }

        const newContent = options.onMessage(data, contentRef.current);
        contentRef.current = newContent;
        scheduleContentFlush();
      };

      eventSource.onerror = (error) => {
        console.error("SSE Error:", error);
        flushContentToState();
        stop();
      };
    },
    [flushContentToState, options, scheduleContentFlush, stop],
  );

  return { content, isStreaming, start, stop, reset };
}

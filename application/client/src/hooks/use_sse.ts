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
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushContent = useCallback(() => {
    if (flushTimerRef.current !== null) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    setContent(contentRef.current);
  }, []);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current !== null) {
      return;
    }
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      setContent(contentRef.current);
    }, 80);
  }, []);

  const stop = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (flushTimerRef.current !== null) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
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

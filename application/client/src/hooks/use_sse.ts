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
  const pendingContentRef = useRef("");
  const animationFrameRef = useRef<number | null>(null);

  const flushContent = useCallback(() => {
    animationFrameRef.current = null;
    setContent(pendingContentRef.current);
  }, []);

  const scheduleContentFlush = useCallback(() => {
    if (animationFrameRef.current != null) {
      return;
    }
    animationFrameRef.current = window.requestAnimationFrame(flushContent);
  }, [flushContent]);

  const stop = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (animationFrameRef.current != null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
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
      pendingContentRef.current = "";
      setContent("");
      setIsStreaming(true);

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data) as T;

        const isDone = options.onDone?.(data) ?? false;
        if (isDone) {
          options.onComplete?.(contentRef.current);
          stop();
          return;
        }

        const newContent = options.onMessage(data, contentRef.current);
        contentRef.current = newContent;
        pendingContentRef.current = newContent;
        scheduleContentFlush();
      };

      eventSource.onerror = (error) => {
        console.error("SSE Error:", error);
        stop();
      };
    },
    [options, scheduleContentFlush, stop],
  );

  return { content, isStreaming, start, stop, reset };
}

import { type RefObject, useCallback, useRef, useState } from "react";

interface SSEOptions<T> {
  onMessage: (data: T, prevContent: string) => string;
  onDone?: (data: T) => boolean;
  onComplete?: (finalContent: string, doneData: T) => void;
}

interface ReturnValues {
  contentRef: RefObject<string>;
  isStreaming: boolean;
  start: (url: string) => void;
  stop: () => void;
  reset: () => void;
}

export function useSSE<T>(options: SSEOptions<T>): ReturnValues {
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const contentRef = useRef("");

  const stop = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    contentRef.current = "";
  }, [stop]);

  const start = useCallback(
    (url: string) => {
      stop();
      contentRef.current = "";
      setIsStreaming(true);

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data) as T;

        const isDone = options.onDone?.(data) ?? false;
        if (isDone) {
          options.onComplete?.(contentRef.current, data);
          stop();
          return;
        }

        const newContent = options.onMessage(data, contentRef.current);
        contentRef.current = newContent;
      };

      eventSource.onerror = (error) => {
        console.error("SSE Error:", error);
        stop();
      };
    },
    [options, stop],
  );

  return { contentRef, isStreaming, start, stop, reset };
}

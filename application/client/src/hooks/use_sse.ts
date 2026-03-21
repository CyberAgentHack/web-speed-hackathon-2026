import { type RefObject, useCallback, useRef, useState } from "react";

interface SSEOptions<T> {
  onMessage: (data: T, prevContent: string) => string;
  onDone?: (data: T) => boolean;
  onComplete?: (finalContent: string, doneData: T) => void;
  getHtml?: (doneData: T) => string | undefined;
}

interface ReturnValues {
  contentRef: RefObject<string>;
  htmlRef: RefObject<string | null>;
  doneDataRef: RefObject<unknown>;
  isStreaming: boolean;
  start: (url: string) => void;
  stop: () => void;
  finalize: () => void;
  reset: () => void;
}

export function useSSE<T>(options: SSEOptions<T>): ReturnValues {
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const contentRef = useRef("");
  const htmlRef = useRef<string | null>(null);
  const doneDataRef = useRef<unknown>(null);

  const stop = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const finalize = useCallback(() => {
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    contentRef.current = "";
    htmlRef.current = null;
    doneDataRef.current = null;
  }, [stop]);

  const start = useCallback(
    (url: string) => {
      stop();
      contentRef.current = "";
      htmlRef.current = null;
      doneDataRef.current = null;
      setIsStreaming(true);

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data) as T;

        const isDone = options.onDone?.(data) ?? false;
        if (isDone) {
          htmlRef.current = options.getHtml?.(data) ?? null;
          doneDataRef.current = data;
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
          // Don't call stop() or setIsStreaming(false) here.
          // StreamingContent will detect htmlRef, inject HTML, then call finalize().
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

  return { contentRef, htmlRef, doneDataRef, isStreaming, start, stop, finalize, reset };
}

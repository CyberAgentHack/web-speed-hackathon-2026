import { useEffect, useEffectEvent } from "react";

interface Options {
  delayMs?: number;
  enabled?: boolean;
}

export function useWs<T>(
  url: string,
  onMessage: (event: T) => void,
  { delayMs = 0, enabled = true }: Options = {},
) {
  const handleMessage = useEffectEvent((event: MessageEvent) => {
    onMessage(JSON.parse(event.data));
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let ws: WebSocket | null = null;
    const timerId = window.setTimeout(() => {
      ws = new WebSocket(url);
      ws.addEventListener("message", handleMessage);
    }, delayMs);

    return () => {
      window.clearTimeout(timerId);
      ws?.removeEventListener("message", handleMessage);
      ws?.close();
    };
  }, [delayMs, enabled, url]);
}

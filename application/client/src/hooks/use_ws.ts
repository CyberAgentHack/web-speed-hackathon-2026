import { useEffect, useEffectEvent } from "react";

export function useWs<T>(url: string | null, onMessage: (event: T) => void) {
  const handleMessage = useEffectEvent((event: MessageEvent) => {
    onMessage(JSON.parse(event.data));
  });

  useEffect(() => {
    if (url == null) return;

    const wsUrl = url;
    let ws: WebSocket | null = null;
    let cancelled = false;

    const init = () => {
      if (cancelled) return;
      ws = new WebSocket(wsUrl);
      ws.addEventListener("message", handleMessage);
    };

    // Delay WebSocket initialization to avoid blocking the main thread
    const idleHandle =
      typeof requestIdleCallback === "function" ? requestIdleCallback(init) : setTimeout(init, 100);

    return () => {
      cancelled = true;
      if (typeof cancelIdleCallback === "function" && typeof idleHandle === "number") {
        cancelIdleCallback(idleHandle);
      } else {
        clearTimeout(idleHandle as ReturnType<typeof setTimeout>);
      }
      if (ws) {
        ws.removeEventListener("message", handleMessage);
        ws.close();
      }
    };
  }, [url]);
}

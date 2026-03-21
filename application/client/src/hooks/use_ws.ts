import { useEffect, useEffectEvent } from "react";

function resolveWebSocketUrl(url: string): string {
  if (typeof window === "undefined") {
    return url;
  }

  const resolved = new URL(url, window.location.href);
  resolved.protocol = resolved.protocol === "https:" ? "wss:" : "ws:";
  return resolved.toString();
}

export function useWs<T>(url: string, onMessage: (event: T) => void) {
  const handleMessage = useEffectEvent((event: MessageEvent) => {
    onMessage(JSON.parse(event.data));
  });

  useEffect(() => {
    const ws = new WebSocket(resolveWebSocketUrl(url));
    ws.addEventListener("message", handleMessage);

    return () => {
      ws.removeEventListener("message", handleMessage);
      ws.close();
    };
  }, [url]);
}

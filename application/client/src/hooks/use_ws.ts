import { useEffect, useEffectEvent } from "react";

export function useWs<T>(url: string, onMessage: (event: T) => void, enabled = true) {
  const handleMessage = useEffectEvent((event: MessageEvent) => {
    onMessage(JSON.parse(event.data));
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const ws = new WebSocket(url);
    ws.addEventListener("message", handleMessage);

    return () => {
      ws.removeEventListener("message", handleMessage);
      ws.close();
    };
  }, [enabled, url]);
}

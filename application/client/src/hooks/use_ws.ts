import { useEffect, useEffectEvent } from "react";

export function useWs<T>(url: string, onMessage: (event: T) => void) {
  const handleMessage = useEffectEvent((event: MessageEvent) => {
    onMessage(JSON.parse(event.data));
  });

  useEffect(() => {
    if (url === "") {
      return;
    }

    const ws = new WebSocket(url);
    ws.addEventListener("message", handleMessage);

    return () => {
      ws.removeEventListener("message", handleMessage);
      ws.close();
    };
  }, [url]);
}

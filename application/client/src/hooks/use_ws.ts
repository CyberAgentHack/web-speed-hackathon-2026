import { useEffect, useRef } from "react";

export function useWs<T>(url: string, onMessage: (event: T) => void) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      onMessageRef.current(JSON.parse(event.data) as T);
    };

    const ws = new WebSocket(url);
    ws.addEventListener("message", handleMessage);

    return () => {
      ws.removeEventListener("message", handleMessage);
      ws.close();
    };
  }, [url]);
}

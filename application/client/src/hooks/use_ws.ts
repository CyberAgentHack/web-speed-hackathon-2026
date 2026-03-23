import { useEffect, useEffectEvent } from "react";

interface Options {
  onOpen?: () => void;
}

export function useWs<T>(url: string, onMessage: (event: T) => void, options: Options = {}) {
  const handleMessage = useEffectEvent((event: MessageEvent) => {
    onMessage(JSON.parse(event.data));
  });
  const handleOpen = useEffectEvent(() => {
    options.onOpen?.();
  });

  useEffect(() => {
    const ws = new WebSocket(url);
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("open", handleOpen);

    return () => {
      ws.removeEventListener("message", handleMessage);
      ws.removeEventListener("open", handleOpen);
      ws.close();
    };
  }, [url]);
}

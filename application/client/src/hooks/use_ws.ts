import { useEffect, useEffectEvent } from "react";

interface UseWsOptions {
  onClose?: () => void;
  onOpen?: () => void;
}

export function useWs<T>(
  url: string,
  onMessage: (event: T) => void,
  options: UseWsOptions = {},
) {
  const handleMessage = useEffectEvent((event: MessageEvent) => {
    onMessage(JSON.parse(event.data));
  });
  const handleOpen = useEffectEvent(() => {
    options.onOpen?.();
  });
  const handleClose = useEffectEvent(() => {
    options.onClose?.();
  });

  // Synchronize the WebSocket connection with the current subscription URL.
  useEffect(() => {
    const ws = new WebSocket(url);
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("open", handleOpen);
    ws.addEventListener("close", handleClose);

    return () => {
      ws.removeEventListener("message", handleMessage);
      ws.removeEventListener("open", handleOpen);
      ws.removeEventListener("close", handleClose);
      ws.close();
    };
  }, [url]);
}

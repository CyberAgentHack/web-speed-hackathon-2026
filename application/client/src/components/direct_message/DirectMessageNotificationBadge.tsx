import { useEffect, useState } from "react";

import { useWs } from "@web-speed-hackathon-2026/client/src/hooks/use_ws";

interface DmUnreadEvent {
  type: "dm:unread";
  payload: {
    unreadCount: number;
  };
}

export const DirectMessageNotificationBadge = () => {
  const [unreadCount, updateUnreadCount] = useState(0);
  const [isEnabled, setIsEnabled] = useState(false);
  const displayCount = unreadCount > 99 ? "99+" : String(unreadCount);

  useEffect(() => {
    const windowWithIdleCallback = window as Window & {
      cancelIdleCallback?: (handle: number) => void;
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number;
    };

    if (typeof windowWithIdleCallback.requestIdleCallback === "function") {
      const idleCallbackId = windowWithIdleCallback.requestIdleCallback(() => {
        setIsEnabled(true);
      }, { timeout: 3000 });
      return () => {
        windowWithIdleCallback.cancelIdleCallback?.(idleCallbackId);
      };
    }

    const timeoutId = window.setTimeout(() => {
      setIsEnabled(true);
    }, 1);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useWs("/api/v1/dm/unread", (event: DmUnreadEvent) => {
    updateUnreadCount(event.payload.unreadCount);
  }, isEnabled);

  if (!isEnabled || unreadCount === 0) {
    return null;
  }
  return (
    <span className="bg-cax-danger text-cax-surface-raised absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-xs font-bold">
      {displayCount}
    </span>
  );
};

import { useState } from "react";
import { useLocation } from "react-router";

import { useWs } from "@web-speed-hackathon-2026/client/src/hooks/use_ws";

interface DmUnreadEvent {
  type: "dm:unread";
  payload: {
    unreadCount: number;
  };
}

// Pages where WebSocket connections are unnecessary (static/non-DM pages)
const SKIP_WS_PATHS = ["/terms", "/crok"];

export const DirectMessageNotificationBadge = () => {
  const { pathname } = useLocation();
  const [unreadCount, updateUnreadCount] = useState(0);
  const displayCount = unreadCount > 99 ? "99+" : String(unreadCount);

  const shouldSkip = SKIP_WS_PATHS.includes(pathname);

  useWs(shouldSkip ? null : "/api/v1/dm/unread", (event: DmUnreadEvent) => {
    updateUnreadCount(event.payload.unreadCount);
  });

  if (unreadCount === 0) {
    return null;
  }
  return (
    <span className="bg-cax-danger text-cax-surface-raised absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-xs font-bold">
      {displayCount}
    </span>
  );
};

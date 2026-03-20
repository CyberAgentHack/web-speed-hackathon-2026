import { useState } from "react";

import { useWs } from "@web-speed-hackathon-2026/client/src/hooks/use_ws";

interface DmUnreadEvent {
  type: "dm:unread";
  payload: {
    unreadCount: number;
  };
}

export const DirectMessageNotificationBadge = () => {
  const [unreadCount, updateUnreadCount] = useState(0);
  const displayCount = unreadCount > 99 ? "99+" : String(unreadCount);

  useWs("/api/v1/dm/unread", (event: DmUnreadEvent) => {
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

import { useCallback, useEffect, useState } from "react";

import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export function useActiveUser() {
  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  const [isLoadingActiveUser, setIsLoadingActiveUser] = useState(true);

  useEffect(() => {
    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        setActiveUser(user);
      })
      .finally(() => {
        setIsLoadingActiveUser(false);
      });
  }, []);

  const onLogout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    setActiveUser(null);
    window.location.href = "/";
  }, []);

  return {
    activeUser,
    isLoadingActiveUser,
    onLogout,
    onUpdateActiveUser: setActiveUser,
  };
}

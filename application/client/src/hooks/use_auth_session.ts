import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import {
  fetchJSON,
  sendJSON,
} from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const AUTH_HINT_COOKIE_NAME = "cax-authenticated";

interface ReturnValues {
  activeUser: Models.User | null;
  refreshActiveUser: () => Promise<void>;
  updateActiveUser: (user: Models.User | null) => void;
  logout: () => Promise<void>;
}

function hasAuthHint(): boolean {
  return document.cookie
    .split("; ")
    .some((cookie) => cookie.startsWith(`${AUTH_HINT_COOKIE_NAME}=1`));
}

function setAuthHint(): void {
  document.cookie = `${AUTH_HINT_COOKIE_NAME}=1; Path=/; SameSite=Lax`;
}

function clearAuthHint(): void {
  document.cookie = `${AUTH_HINT_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}

export function useAuthSession(): ReturnValues {
  const navigate = useNavigate();
  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  const authStateVersionRef = useRef(0);

  const updateActiveUser = useCallback((user: Models.User | null) => {
    authStateVersionRef.current += 1;
    if (user === null) {
      clearAuthHint();
    } else {
      setAuthHint();
    }
    setActiveUser(user);
  }, []);

  const refreshActiveUser = useCallback(async () => {
    if (!hasAuthHint()) {
      setActiveUser(null);
      return;
    }

    const requestVersion = authStateVersionRef.current;

    try {
      const user = await fetchJSON<Models.User>("/api/v1/me");
      if (requestVersion === authStateVersionRef.current) {
        setAuthHint();
        setActiveUser(user);
      }
    } catch {
      if (requestVersion === authStateVersionRef.current) {
        clearAuthHint();
        setActiveUser(null);
      }
    }
  }, []);

  useEffect(() => {
    void refreshActiveUser();
  }, [refreshActiveUser]);

  const logout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    updateActiveUser(null);
    navigate("/");
  }, [navigate, updateActiveUser]);

  return {
    activeUser,
    refreshActiveUser,
    updateActiveUser,
    logout,
  };
}

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import {
  fetchJSON,
  sendJSON,
} from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const AUTH_HINT_COOKIE_NAME = "cax-authenticated";
const USER_CACHE_KEY = "cax-user";

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

function getCachedUser(): Models.User | null {
  try {
    const json = sessionStorage.getItem(USER_CACHE_KEY);
    return json ? (JSON.parse(json) as Models.User) : null;
  } catch {
    return null;
  }
}

function setCachedUser(user: Models.User | null): void {
  if (user === null) {
    sessionStorage.removeItem(USER_CACHE_KEY);
  } else {
    sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  }
}

export function useAuthSession(): ReturnValues {
  const navigate = useNavigate();
  const [activeUser, setActiveUser] = useState<Models.User | null>(() => {
    if (!hasAuthHint()) return null;
    return getCachedUser();
  });
  const authStateVersionRef = useRef(0);

  const updateActiveUser = useCallback((user: Models.User | null) => {
    authStateVersionRef.current += 1;
    if (user === null) {
      clearAuthHint();
      setCachedUser(null);
    } else {
      setAuthHint();
      setCachedUser(user);
    }
    setActiveUser(user);
  }, []);

  const refreshActiveUser = useCallback(async () => {
    if (!hasAuthHint()) {
      setCachedUser(null);
      setActiveUser(null);
      return;
    }

    const requestVersion = authStateVersionRef.current;

    try {
      const user = await fetchJSON<Models.User>("/api/v1/me");
      if (requestVersion === authStateVersionRef.current) {
        setAuthHint();
        setCachedUser(user);
        setActiveUser(user);
      }
    } catch {
      if (requestVersion === authStateVersionRef.current) {
        clearAuthHint();
        setCachedUser(null);
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

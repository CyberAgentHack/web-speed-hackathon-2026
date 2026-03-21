import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState } from "react";
import { HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import type { AuthStatus } from "@web-speed-hackathon-2026/client/src/auth/types";
import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const CrokContainer = lazy(async () => {
  const { CrokContainer } = await import("@web-speed-hackathon-2026/client/src/containers/CrokContainer");
  return { default: CrokContainer };
});
const DirectMessageContainer = lazy(async () => {
  const { DirectMessageContainer } = await import(
    "@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer"
  );
  return { default: DirectMessageContainer };
});
const DirectMessageListContainer = lazy(async () => {
  const { DirectMessageListContainer } = await import(
    "@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer"
  );
  return { default: DirectMessageListContainer };
});
const NotFoundContainer = lazy(async () => {
  const { NotFoundContainer } = await import(
    "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer"
  );
  return { default: NotFoundContainer };
});
const PostContainer = lazy(async () => {
  const { PostContainer } = await import("@web-speed-hackathon-2026/client/src/containers/PostContainer");
  return { default: PostContainer };
});
const SearchContainer = lazy(async () => {
  const { SearchContainer } = await import("@web-speed-hackathon-2026/client/src/containers/SearchContainer");
  return { default: SearchContainer };
});
const TermContainer = lazy(async () => {
  const { TermContainer } = await import("@web-speed-hackathon-2026/client/src/containers/TermContainer");
  return { default: TermContainer };
});
const UserProfileContainer = lazy(async () => {
  const { UserProfileContainer } = await import(
    "@web-speed-hackathon-2026/client/src/containers/UserProfileContainer"
  );
  return { default: UserProfileContainer };
});

function isProtectedPath(pathname: string): boolean {
  return pathname === "/dm" || pathname.startsWith("/dm/") || pathname === "/crok";
}

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // Synchronize the browser scroll position with route changes.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  const authModalId = useId();
  const newPostModalId = useId();
  const latestAuthRequestIdRef = useRef(0);
  const authStateRef = useRef<{
    activeUser: Models.User | null;
    authStatus: AuthStatus;
  }>({
    activeUser: null,
    authStatus: "loading",
  });
  authStateRef.current = {
    activeUser,
    authStatus,
  };

  const showAuthModal = useCallback(() => {
    const dialog = document.getElementById(authModalId);
    if (dialog instanceof HTMLDialogElement && !dialog.open) {
      dialog.showModal();
    }
  }, [authModalId]);
  const handleSessionExpired = useCallback(
    ({ showAuthModal: shouldShowAuthModal = false }: { showAuthModal?: boolean } = {}) => {
      latestAuthRequestIdRef.current += 1;
      setActiveUser(null);
      setAuthStatus("signedOut");
      if (shouldShowAuthModal) {
        window.requestAnimationFrame(showAuthModal);
      }
    },
    [showAuthModal],
  );
  const handleProtectedSessionExpired = useCallback(() => {
    handleSessionExpired({
      showAuthModal: true,
    });
  }, [handleSessionExpired]);
  const syncAuthState = useCallback(
    async (nextPathname: string) => {
      const requestId = latestAuthRequestIdRef.current + 1;
      latestAuthRequestIdRef.current = requestId;

      try {
        const requestUrl = new URL("/api/v1/me", window.location.origin);
        requestUrl.searchParams.set("authRequestId", String(requestId));
        const user = await fetchJSON<Models.User>(`${requestUrl.pathname}${requestUrl.search}`, {
          cache: "no-store",
        });
        if (requestId !== latestAuthRequestIdRef.current) {
          return;
        }
        setActiveUser(user);
        setAuthStatus("signedIn");
      } catch {
        if (requestId !== latestAuthRequestIdRef.current) {
          return;
        }
        const shouldShowAuthModal =
          authStateRef.current.authStatus === "signedIn" &&
          authStateRef.current.activeUser !== null &&
          isProtectedPath(nextPathname);
        handleSessionExpired({
          showAuthModal: shouldShowAuthModal,
        });
      }
    },
    [handleSessionExpired],
  );

  // Synchronize with the server session whenever the current route changes.
  useEffect(() => {
    void syncAuthState(pathname);
  }, [pathname, syncAuthState]);
  const handleUpdateActiveUser = useCallback((user: Models.User) => {
    setActiveUser(user);
    setAuthStatus("signedIn");
  }, []);
  const handleLogout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    setActiveUser(null);
    setAuthStatus("signedOut");
    navigate("/");
  }, [navigate]);

  return (
    <HelmetProvider>
      <AppPage
        activeUser={activeUser}
        authStatus={authStatus}
        authModalId={authModalId}
        newPostModalId={newPostModalId}
        onLogout={handleLogout}
      >
        <Suspense fallback={null}>
          <Routes>
            <Route element={<TimelineContainer />} path="/" />
            <Route
              element={
                <DirectMessageListContainer
                  activeUser={activeUser}
                  authModalId={authModalId}
                  authStatus={authStatus}
                  onSessionExpired={handleProtectedSessionExpired}
                />
              }
              path="/dm"
            />
            <Route
              element={
                <DirectMessageContainer
                  activeUser={activeUser}
                  authModalId={authModalId}
                  authStatus={authStatus}
                  onSessionExpired={handleProtectedSessionExpired}
                />
              }
              path="/dm/:conversationId"
            />
            <Route element={<SearchContainer />} path="/search" />
            <Route element={<UserProfileContainer />} path="/users/:username" />
            <Route element={<PostContainer />} path="/posts/:postId" />
            <Route element={<TermContainer />} path="/terms" />
            <Route
              element={
                <CrokContainer
                  activeUser={activeUser}
                  authModalId={authModalId}
                  authStatus={authStatus}
                />
              }
              path="/crok"
            />
            <Route element={<NotFoundContainer />} path="*" />
          </Routes>
        </Suspense>
      </AppPage>

      <AuthModalContainer id={authModalId} onUpdateActiveUser={handleUpdateActiveUser} />
      <NewPostModalContainer id={newPostModalId} />
    </HelmetProvider>
  );
};

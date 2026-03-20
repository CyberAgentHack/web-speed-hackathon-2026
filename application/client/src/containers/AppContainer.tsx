import { Suspense, lazy, useCallback, useEffect, useId, useRef, useState } from "react";
import { HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { DirectMessageContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer";
import { DirectMessageListContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { PostContainer } from "@web-speed-hackathon-2026/client/src/containers/PostContainer";
import { SearchContainer } from "@web-speed-hackathon-2026/client/src/containers/SearchContainer";
import { TermContainer } from "@web-speed-hackathon-2026/client/src/containers/TermContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { UserProfileContainer } from "@web-speed-hackathon-2026/client/src/containers/UserProfileContainer";
import { consumeBootstrapData } from "@web-speed-hackathon-2026/client/src/utils/bootstrap_data";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const LazyCrokContainer = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/containers/CrokContainer");
  return { default: module.CrokContainer };
});

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  const [isLoadingActiveUser, setIsLoadingActiveUser] = useState(true);
  const activeUserRequestIdRef = useRef(0);

  const applyActiveUser = useCallback((user: Models.User | null) => {
    activeUserRequestIdRef.current += 1;
    setActiveUser(user);
    setIsLoadingActiveUser(false);
  }, []);

  useEffect(() => {
    const shouldPrioritizeAuth = pathname.startsWith("/dm") || pathname === "/crok";
    let cancelled = false;

    const requestId = activeUserRequestIdRef.current + 1;
    activeUserRequestIdRef.current = requestId;

    const loadActiveUser = () => {
      const bootstrapUser = consumeBootstrapData<Models.User>("/api/v1/me");
      if (bootstrapUser !== null) {
        setActiveUser(bootstrapUser);
        setIsLoadingActiveUser(false);
        return;
      }

      void fetchJSON<Models.User>("/api/v1/me")
        .then((user) => {
          if (cancelled || activeUserRequestIdRef.current !== requestId) {
            return;
          }
          setActiveUser(user);
        })
        .catch(() => {
          if (cancelled || activeUserRequestIdRef.current !== requestId) {
            return;
          }
          setActiveUser(null);
        })
        .finally(() => {
          if (cancelled || activeUserRequestIdRef.current !== requestId) {
            return;
          }
          setIsLoadingActiveUser(false);
        });
    };

    if (shouldPrioritizeAuth) {
      setIsLoadingActiveUser(true);
      loadActiveUser();
      return () => {
        cancelled = true;
      };
    }

    let idleCallbackId: number | null = null;
    const timeoutId = window.setTimeout(() => {
      if ("requestIdleCallback" in window) {
        idleCallbackId = window.requestIdleCallback(loadActiveUser, { timeout: 3000 });
      } else {
        loadActiveUser();
      }
    }, 1000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      if (idleCallbackId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId);
      }
    };
  }, [pathname]);
  const handleLogout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    applyActiveUser(null);
    navigate("/");
  }, [applyActiveUser, navigate]);

  const authModalId = useId();
  const newPostModalId = useId();

  return (
    <HelmetProvider>
      <AppPage
        activeUser={activeUser}
        authModalId={authModalId}
        newPostModalId={newPostModalId}
        onLogout={handleLogout}
      >
        <Routes>
          <Route element={<TimelineContainer />} path="/" />
          <Route
            element={
              isLoadingActiveUser ? null : (
                <DirectMessageListContainer activeUser={activeUser} authModalId={authModalId} />
              )
            }
            path="/dm"
          />
          <Route
            element={
              isLoadingActiveUser ? null : (
                <DirectMessageContainer activeUser={activeUser} authModalId={authModalId} />
              )
            }
            path="/dm/:conversationId"
          />
          <Route element={<SearchContainer />} path="/search" />
          <Route element={<UserProfileContainer />} path="/users/:username" />
          <Route element={<PostContainer />} path="/posts/:postId" />
          <Route element={<TermContainer />} path="/terms" />
          <Route
            element={
              <Suspense fallback={null}>
                {!isLoadingActiveUser ? (
                  <LazyCrokContainer activeUser={activeUser} authModalId={authModalId} />
                ) : null}
              </Suspense>
            }
            path="/crok"
          />
          <Route element={<NotFoundContainer />} path="*" />
        </Routes>
      </AppPage>

      <AuthModalContainer id={authModalId} onUpdateActiveUser={applyActiveUser} />
      <NewPostModalContainer id={newPostModalId} />
    </HelmetProvider>
  );
};

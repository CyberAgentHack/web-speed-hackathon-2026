import { lazy, Suspense, useCallback, useEffect, useId, useState } from "react";
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

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // Synchronize the browser scroll position with route changes.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [activeUser, setActiveUser] = useState<Models.User | null>(null);

  // Synchronize with the server session to resolve the current auth state.
  useEffect(() => {
    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        setActiveUser(user);
        setAuthStatus("signedIn");
      })
      .catch(() => {
        setActiveUser(null);
        setAuthStatus("signedOut");
      });
  }, []);
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

  const authModalId = useId();
  const newPostModalId = useId();

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

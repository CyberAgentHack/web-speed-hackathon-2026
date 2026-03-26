import { Suspense, lazy, useCallback, useEffect, useId, useState } from "react";
import { HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const DirectMessageListRoute = lazy(async () => ({
  default: (await import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer"))
    .DirectMessageListContainer,
}));

const DirectMessageRoute = lazy(async () => ({
  default: (await import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer"))
    .DirectMessageContainer,
}));

const SearchRoute = lazy(async () => ({
  default: (await import("@web-speed-hackathon-2026/client/src/containers/SearchContainer")).SearchContainer,
}));

const UserProfileRoute = lazy(async () => ({
  default: (await import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer"))
    .UserProfileContainer,
}));

const PostRoute = lazy(async () => ({
  default: (await import("@web-speed-hackathon-2026/client/src/containers/PostContainer")).PostContainer,
}));

const TermRoute = lazy(async () => ({
  default: (await import("@web-speed-hackathon-2026/client/src/containers/TermContainer")).TermContainer,
}));

const CrokRoute = lazy(async () => ({
  default: (await import("@web-speed-hackathon-2026/client/src/containers/CrokContainer")).CrokContainer,
}));

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  useEffect(() => {
    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        setActiveUser(user);
      })
      .catch(() => {
        setActiveUser(null);
      });
  }, []);
  const handleLogout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    setActiveUser(null);
    navigate("/");
  }, [navigate]);

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
              <Suspense fallback={null}>
                <DirectMessageListRoute activeUser={activeUser} authModalId={authModalId} />
              </Suspense>
            }
            path="/dm"
          />
          <Route
            element={
              <Suspense fallback={null}>
                <DirectMessageRoute activeUser={activeUser} authModalId={authModalId} />
              </Suspense>
            }
            path="/dm/:conversationId"
          />
          <Route
            element={
              <Suspense fallback={null}>
                <SearchRoute />
              </Suspense>
            }
            path="/search"
          />
          <Route
            element={
              <Suspense fallback={null}>
                <UserProfileRoute />
              </Suspense>
            }
            path="/users/:username"
          />
          <Route
            element={
              <Suspense fallback={null}>
                <PostRoute />
              </Suspense>
            }
            path="/posts/:postId"
          />
          <Route
            element={
              <Suspense fallback={null}>
                <TermRoute />
              </Suspense>
            }
            path="/terms"
          />
          <Route
            element={
              <Suspense fallback={null}>
                <CrokRoute activeUser={activeUser} authModalId={authModalId} />
              </Suspense>
            }
            path="/crok"
          />
          <Route element={<NotFoundContainer />} path="*" />
        </Routes>
      </AppPage>

      <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
      <NewPostModalContainer id={newPostModalId} />
    </HelmetProvider>
  );
};

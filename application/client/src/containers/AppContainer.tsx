import { lazy, Suspense, type ReactNode, useCallback, useEffect, useId, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const CrokContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then((m) => ({
    default: m.CrokContainer,
  })),
);
const DirectMessageContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer").then((m) => ({
    default: m.DirectMessageContainer,
  })),
);
const DirectMessageListContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer").then(
    (m) => ({ default: m.DirectMessageListContainer }),
  ),
);
const PostContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/PostContainer").then((m) => ({
    default: m.PostContainer,
  })),
);
const SearchContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/SearchContainer").then((m) => ({
    default: m.SearchContainer,
  })),
);
const TermContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/TermContainer").then((m) => ({
    default: m.TermContainer,
  })),
);
const UserProfileContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then((m) => ({
    default: m.UserProfileContainer,
  })),
);

const ROUTE_LOADING_FALLBACK = (
  <div className="animate-pulse space-y-3 p-4">
    <div className="bg-cax-border h-4 w-3/4 rounded" />
    <div className="bg-cax-border h-4 w-1/2 rounded" />
    <div className="bg-cax-border h-4 w-5/6 rounded" />
  </div>
);

const LazyRoute = ({ children }: { children: ReactNode }) => {
  return <Suspense fallback={ROUTE_LOADING_FALLBACK}>{children}</Suspense>;
};

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
      .catch(() => {});
  }, []);
  const handleLogout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    setActiveUser(null);
    navigate("/");
  }, [navigate]);

  const authModalId = useId();
  const newPostModalId = useId();

  return (
    <>
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
              <LazyRoute>
                <DirectMessageListContainer activeUser={activeUser} authModalId={authModalId} />
              </LazyRoute>
            }
            path="/dm"
          />
          <Route
            element={
              <LazyRoute>
                <DirectMessageContainer activeUser={activeUser} authModalId={authModalId} />
              </LazyRoute>
            }
            path="/dm/:conversationId"
          />
          <Route
            element={
              <LazyRoute>
                <SearchContainer />
              </LazyRoute>
            }
            path="/search"
          />
          <Route
            element={
              <LazyRoute>
                <UserProfileContainer />
              </LazyRoute>
            }
            path="/users/:username"
          />
          <Route
            element={
              <LazyRoute>
                <PostContainer />
              </LazyRoute>
            }
            path="/posts/:postId"
          />
          <Route
            element={
              <LazyRoute>
                <TermContainer />
              </LazyRoute>
            }
            path="/terms"
          />
          <Route
            element={
              <LazyRoute>
                <CrokContainer activeUser={activeUser} authModalId={authModalId} />
              </LazyRoute>
            }
            path="/crok"
          />
          <Route element={<NotFoundContainer />} path="*" />
        </Routes>
      </AppPage>

      <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
      {activeUser !== null ? <NewPostModalContainer id={newPostModalId} /> : null}
    </>
  );
};

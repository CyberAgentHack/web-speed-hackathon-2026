import { lazy, Suspense, type ReactNode, useCallback, useEffect, useId, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetch_json";

const CrokContainer = lazy(async () =>
  import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then((module) => ({
    default: module.CrokContainer,
  })),
);
const DirectMessageContainer = lazy(async () =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer").then(
    (module) => ({
      default: module.DirectMessageContainer,
    }),
  ),
);
const DirectMessageListContainer = lazy(async () =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer").then(
    (module) => ({
      default: module.DirectMessageListContainer,
    }),
  ),
);
const PostContainer = lazy(async () =>
  import("@web-speed-hackathon-2026/client/src/containers/PostContainer").then((module) => ({
    default: module.PostContainer,
  })),
);
const SearchContainer = lazy(async () =>
  import("@web-speed-hackathon-2026/client/src/containers/SearchContainer").then((module) => ({
    default: module.SearchContainer,
  })),
);
const TermContainer = lazy(async () =>
  import("@web-speed-hackathon-2026/client/src/containers/TermContainer").then((module) => ({
    default: module.TermContainer,
  })),
);
const UserProfileContainer = lazy(async () =>
  import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then(
    (module) => ({
      default: module.UserProfileContainer,
    }),
  ),
);

const LazyRoute = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={null}>{children}</Suspense>
);

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
  }, [setActiveUser]);
  const handleLogout = useCallback(async () => {
    const { sendJSON } = await import("@web-speed-hackathon-2026/client/src/utils/send_json_gzip");
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
      <NewPostModalContainer id={newPostModalId} />
    </>
  );
};

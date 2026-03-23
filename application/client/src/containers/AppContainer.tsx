import { lazy, Suspense, useCallback, useEffect, useId, useState } from "react";
import { HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import {
  fetchJSON,
  sendJSON,
} from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const lazyLoad = <T extends Record<string, React.ComponentType<any>>>(
  factory: () => Promise<T>,
  name: keyof T,
) => lazy(() => factory().then((m) => ({ default: m[name] })));

const CrokContainer = lazyLoad(
  () => import("@web-speed-hackathon-2026/client/src/containers/CrokContainer"),
  "CrokContainer",
);
const DirectMessageContainer = lazyLoad(
  () =>
    import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer"),
  "DirectMessageContainer",
);
const DirectMessageListContainer = lazyLoad(
  () =>
    import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer"),
  "DirectMessageListContainer",
);
const NotFoundContainer = lazyLoad(
  () =>
    import("@web-speed-hackathon-2026/client/src/containers/NotFoundContainer"),
  "NotFoundContainer",
);
const PostContainer = lazyLoad(
  () => import("@web-speed-hackathon-2026/client/src/containers/PostContainer"),
  "PostContainer",
);
const SearchContainer = lazyLoad(
  () =>
    import("@web-speed-hackathon-2026/client/src/containers/SearchContainer"),
  "SearchContainer",
);
const TermContainer = lazyLoad(
  () => import("@web-speed-hackathon-2026/client/src/containers/TermContainer"),
  "TermContainer",
);
const UserProfileContainer = lazyLoad(
  () =>
    import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer"),
  "UserProfileContainer",
);

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  useEffect(() => {
    void fetchJSON<Models.User>("/api/v1/me").then((user) => {
      setActiveUser(user);
    });
  }, [setActiveUser]);
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
              <Suspense>
                <DirectMessageListContainer
                  activeUser={activeUser}
                  authModalId={authModalId}
                />
              </Suspense>
            }
            path="/dm"
          />
          <Route
            element={
              <Suspense>
                <DirectMessageContainer
                  activeUser={activeUser}
                  authModalId={authModalId}
                />
              </Suspense>
            }
            path="/dm/:conversationId"
          />
          <Route
            element={
              <Suspense>
                <SearchContainer />
              </Suspense>
            }
            path="/search"
          />
          <Route
            element={
              <Suspense>
                <UserProfileContainer />
              </Suspense>
            }
            path="/users/:username"
          />
          <Route
            element={
              <Suspense>
                <PostContainer />
              </Suspense>
            }
            path="/posts/:postId"
          />
          <Route
            element={
              <Suspense>
                <TermContainer />
              </Suspense>
            }
            path="/terms"
          />
          <Route
            element={
              <Suspense>
                <CrokContainer
                  activeUser={activeUser}
                  authModalId={authModalId}
                />
              </Suspense>
            }
            path="/crok"
          />
          <Route
            element={
              <Suspense>
                <NotFoundContainer />
              </Suspense>
            }
            path="*"
          />
        </Routes>
      </AppPage>

      <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
      <NewPostModalContainer id={newPostModalId} />
    </HelmetProvider>
  );
};

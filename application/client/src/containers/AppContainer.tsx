import { Suspense, useCallback, useEffect, useId, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { DirectMessageContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer";
import { DirectMessageListContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { PostContainer } from "@web-speed-hackathon-2026/client/src/containers/PostContainer";
import { SearchContainer } from "@web-speed-hackathon-2026/client/src/containers/SearchContainer";
import { TermContainer } from "@web-speed-hackathon-2026/client/src/containers/TermContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { fetchJSON, HTTPError, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { lazyNamed } from "@web-speed-hackathon-2026/client/src/utils/lazy";

const UserProfileContainerLazy = lazyNamed(
  () =>
    import(
      /* webpackChunkName: "route-user-profile" */ "@web-speed-hackathon-2026/client/src/containers/UserProfileContainer"
    ),
  "UserProfileContainer",
);
const CrokContainerLazy = lazyNamed(
  () =>
    import(
      /* webpackChunkName: "route-crok" */ "@web-speed-hackathon-2026/client/src/containers/CrokContainer"
    ),
  "CrokContainer",
);
const NotFoundContainerLazy = lazyNamed(
  () =>
    import(
      /* webpackChunkName: "route-not-found" */ "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer"
    ),
  "NotFoundContainer",
);

function requiresResolvedActiveUser(pathname: string) {
  return pathname === "/crok" || pathname.startsWith("/dm");
}

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  const [hasResolvedActiveUser, setHasResolvedActiveUser] = useState(false);
  useEffect(() => {
    let isDisposed = false;

    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        if (!isDisposed) {
          setActiveUser(user);
        }
      })
      .catch((error: unknown) => {
        if (isDisposed) {
          return;
        }
        if (error instanceof HTTPError && error.status === 401) {
          setActiveUser(null);
          return;
        }
        console.error(error);
      })
      .finally(() => {
        if (!isDisposed) {
          setHasResolvedActiveUser(true);
        }
      });

    return () => {
      isDisposed = true;
    };
  }, []);
  const handleLogout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    setActiveUser(null);
    navigate("/");
  }, [navigate]);

  const authModalId = useId();
  const newPostModalId = useId();

  if (!hasResolvedActiveUser && requiresResolvedActiveUser(pathname)) {
    return (
      <HelmetProvider>
        <Helmet>
          <title>読込中 - CaX</title>
        </Helmet>
      </HelmetProvider>
    );
  }

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
            element={<DirectMessageListContainer activeUser={activeUser} authModalId={authModalId} />}
            path="/dm"
          />
          <Route
            element={<DirectMessageContainer activeUser={activeUser} authModalId={authModalId} />}
            path="/dm/:conversationId"
          />
          <Route element={<SearchContainer />} path="/search" />
          <Route
            element={
              <Suspense fallback={null}>
                <UserProfileContainerLazy />
              </Suspense>
            }
            path="/users/:username"
          />
          <Route element={<PostContainer />} path="/posts/:postId" />
          <Route element={<TermContainer />} path="/terms" />
          <Route
            element={
              <Suspense fallback={null}>
                <CrokContainerLazy activeUser={activeUser} authModalId={authModalId} />
              </Suspense>
            }
            path="/crok"
          />
          <Route
            element={
              <Suspense fallback={null}>
                <NotFoundContainerLazy />
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

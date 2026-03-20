import { Suspense, useCallback, useEffect, useId, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { fetchJSON, HTTPError, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { lazyNamed } from "@web-speed-hackathon-2026/client/src/utils/lazy";

const TimelineContainer = lazyNamed(
  () =>
    import(
      /* webpackChunkName: "route-timeline" */ "@web-speed-hackathon-2026/client/src/containers/TimelineContainer"
    ),
  "TimelineContainer",
);
const DirectMessageListContainer = lazyNamed(
  () =>
    import(
      /* webpackChunkName: "route-direct-message-list" */ "@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer"
    ),
  "DirectMessageListContainer",
);
const DirectMessageContainer = lazyNamed(
  () =>
    import(
      /* webpackChunkName: "route-direct-message" */ "@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer"
    ),
  "DirectMessageContainer",
);
const SearchContainer = lazyNamed(
  () =>
    import(
      /* webpackChunkName: "route-search" */ "@web-speed-hackathon-2026/client/src/containers/SearchContainer"
    ),
  "SearchContainer",
);
const UserProfileContainer = lazyNamed(
  () =>
    import(
      /* webpackChunkName: "route-user-profile" */ "@web-speed-hackathon-2026/client/src/containers/UserProfileContainer"
    ),
  "UserProfileContainer",
);
const PostContainer = lazyNamed(
  () =>
    import(
      /* webpackChunkName: "route-post" */ "@web-speed-hackathon-2026/client/src/containers/PostContainer"
    ),
  "PostContainer",
);
const TermContainer = lazyNamed(
  () =>
    import(
      /* webpackChunkName: "route-term" */ "@web-speed-hackathon-2026/client/src/containers/TermContainer"
    ),
  "TermContainer",
);
const CrokContainer = lazyNamed(
  () =>
    import(
      /* webpackChunkName: "route-crok" */ "@web-speed-hackathon-2026/client/src/containers/CrokContainer"
    ),
  "CrokContainer",
);
const NotFoundContainer = lazyNamed(
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
        <Suspense fallback={null}>
          <Routes>
            <Route element={<TimelineContainer />} path="/" />
            <Route
              element={
                <DirectMessageListContainer activeUser={activeUser} authModalId={authModalId} />
              }
              path="/dm"
            />
            <Route
              element={<DirectMessageContainer activeUser={activeUser} authModalId={authModalId} />}
              path="/dm/:conversationId"
            />
            <Route element={<SearchContainer />} path="/search" />
            <Route element={<UserProfileContainer />} path="/users/:username" />
            <Route element={<PostContainer />} path="/posts/:postId" />
            <Route element={<TermContainer />} path="/terms" />
            <Route
              element={<CrokContainer activeUser={activeUser} authModalId={authModalId} />}
              path="/crok"
            />
            <Route element={<NotFoundContainer />} path="*" />
          </Routes>
        </Suspense>
      </AppPage>

      <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
      <NewPostModalContainer id={newPostModalId} />
    </HelmetProvider>
  );
};

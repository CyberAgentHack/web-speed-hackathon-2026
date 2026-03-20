import { Suspense, lazy, useCallback, useEffect, useId, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

// Lazy-loaded route containers (only heavy routes with large dependencies)
const CrokContainer = lazy(async () => {
  const module = await import(
    /* webpackChunkName: "route-crok" */
    "@web-speed-hackathon-2026/client/src/containers/CrokContainer"
  );
  return { default: module.CrokContainer };
});
const DirectMessageContainer = lazy(async () => {
  const module = await import(
    /* webpackChunkName: "route-direct-message" */
    "@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer"
  );
  return { default: module.DirectMessageContainer };
});
const DirectMessageListContainer = lazy(async () => {
  const module = await import(
    /* webpackChunkName: "route-direct-message-list" */
    "@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer"
  );
  return { default: module.DirectMessageListContainer };
});
const PostContainer = lazy(async () => {
  const module = await import(
    /* webpackChunkName: "route-post" */
    "@web-speed-hackathon-2026/client/src/containers/PostContainer"
  );
  return { default: module.PostContainer };
});
const SearchContainer = lazy(async () => {
  const module = await import(
    /* webpackChunkName: "route-search" */
    "@web-speed-hackathon-2026/client/src/containers/SearchContainer"
  );
  return { default: module.SearchContainer };
});
const TermContainer = lazy(async () => {
  const module = await import(
    /* webpackChunkName: "route-terms" */
    "@web-speed-hackathon-2026/client/src/containers/TermContainer"
  );
  return { default: module.TermContainer };
});
const UserProfileContainer = lazy(async () => {
  const module = await import(
    /* webpackChunkName: "route-user-profile" */
    "@web-speed-hackathon-2026/client/src/containers/UserProfileContainer"
  );
  return { default: module.UserProfileContainer };
});
const NotFoundContainer = lazy(async () => {
  const module = await import(
    /* webpackChunkName: "route-not-found" */
    "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer"
  );
  return { default: module.NotFoundContainer };
});

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  const [isLoadingActiveUser, setIsLoadingActiveUser] = useState(true);
  useEffect(() => {
    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        setActiveUser(user);
      })
      .finally(() => {
        setIsLoadingActiveUser(false);
      });
  }, [setActiveUser, setIsLoadingActiveUser]);
  const handleLogout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    setActiveUser(null);
    navigate("/");
  }, [navigate]);

  const authModalId = useId();
  const newPostModalId = useId();

  if (isLoadingActiveUser) {
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

import { lazy, Suspense, useEffect, useId } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { useAuthSession } from "@web-speed-hackathon-2026/client/src/hooks/use_auth_session";

const LazyCrokContainer = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/containers/CrokContainer");
  return { default: module.CrokContainer };
});

const LazyDirectMessageContainer = lazy(async () => {
  const module = await import(
    "@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer"
  );
  return { default: module.DirectMessageContainer };
});

const LazyDirectMessageListContainer = lazy(async () => {
  const module = await import(
    "@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer"
  );
  return { default: module.DirectMessageListContainer };
});

const LazyNotFoundContainer = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/containers/NotFoundContainer");
  return { default: module.NotFoundContainer };
});

const LazyPostContainer = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/containers/PostContainer");
  return { default: module.PostContainer };
});

const LazySearchContainer = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/containers/SearchContainer");
  return { default: module.SearchContainer };
});

const LazyTermContainer = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/containers/TermContainer");
  return { default: module.TermContainer };
});

const LazyTimelineContainer = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/containers/TimelineContainer");
  return { default: module.TimelineContainer };
});

const LazyUserProfileContainer = lazy(async () => {
  const module = await import(
    "@web-speed-hackathon-2026/client/src/containers/UserProfileContainer"
  );
  return { default: module.UserProfileContainer };
});

const RouteFallback = () => {
  return (
    <>
      <Helmet>
        <title>読込中 - CaX</title>
      </Helmet>
      <div className="flex min-h-[calc(100vh-(--spacing(12)))] items-center justify-center px-4 lg:min-h-screen">
        <p className="text-cax-text-muted text-sm">読込中...</p>
      </div>
    </>
  );
};

export const AppContainer = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const { activeUser, logout, updateActiveUser } = useAuthSession();

  const authModalId = useId();
  const newPostModalId = useId();

  return (
    <HelmetProvider>
      <AppPage
        activeUser={activeUser}
        authModalId={authModalId}
        newPostModalId={newPostModalId}
        onLogout={logout}
      >
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<LazyTimelineContainer />} path="/" />
            <Route
              element={
                <LazyDirectMessageListContainer
                  activeUser={activeUser}
                  authModalId={authModalId}
                />
              }
              path="/dm"
            />
            <Route
              element={
                <LazyDirectMessageContainer activeUser={activeUser} authModalId={authModalId} />
              }
              path="/dm/:conversationId"
            />
            <Route element={<LazySearchContainer />} path="/search" />
            <Route element={<LazyUserProfileContainer />} path="/users/:username" />
            <Route element={<LazyPostContainer />} path="/posts/:postId" />
            <Route element={<LazyTermContainer />} path="/terms" />
            <Route
              element={<LazyCrokContainer activeUser={activeUser} authModalId={authModalId} />}
              path="/crok"
            />
            <Route element={<LazyNotFoundContainer />} path="*" />
          </Routes>
        </Suspense>
      </AppPage>

      <AuthModalContainer id={authModalId} onUpdateActiveUser={updateActiveUser} />
      <NewPostModalContainer id={newPostModalId} />
    </HelmetProvider>
  );
};

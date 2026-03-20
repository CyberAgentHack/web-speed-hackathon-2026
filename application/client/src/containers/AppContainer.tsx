import { lazy, Suspense, useCallback, useEffect, useId, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { useAuthSession } from "@web-speed-hackathon-2026/client/src/hooks/use_auth_session";

const loadAuthModalContainer = () =>
  import("@web-speed-hackathon-2026/client/src/containers/AuthModalContainer");
const LazyAuthModalContainer = lazy(async () => {
  const module = await loadAuthModalContainer();
  return { default: module.AuthModalContainer };
});

const loadNewPostModalContainer = () =>
  import("@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer");
const LazyNewPostModalContainer = lazy(async () => {
  const module = await loadNewPostModalContainer();
  return { default: module.NewPostModalContainer };
});

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

function scheduleIdleTask(task: () => void): () => void {
  if ("requestIdleCallback" in window) {
    const callbackId = window.requestIdleCallback(() => {
      task();
    });
    return () => {
      window.cancelIdleCallback(callbackId);
    };
  }

  const timeoutId = globalThis.setTimeout(task, 300);
  return () => {
    globalThis.clearTimeout(timeoutId);
  };
}

export const AppContainer = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const { activeUser, logout, updateActiveUser } = useAuthSession();

  const authModalId = useId();
  const newPostModalId = useId();
  const [shouldLoadAuthModal, setShouldLoadAuthModal] = useState(false);
  const [shouldLoadNewPostModal, setShouldLoadNewPostModal] = useState(false);
  const [authOpenRequestKey, setAuthOpenRequestKey] = useState(0);
  const [newPostOpenRequestKey, setNewPostOpenRequestKey] = useState(0);

  const handleRequestAuthModal = useCallback(() => {
    setShouldLoadAuthModal(true);
    setAuthOpenRequestKey((key) => key + 1);
  }, []);

  const handleRequestNewPostModal = useCallback(() => {
    setShouldLoadNewPostModal(true);
    setNewPostOpenRequestKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (activeUser == null) {
      return scheduleIdleTask(() => {
        void loadAuthModalContainer();
      });
    }

    return scheduleIdleTask(() => {
      void loadNewPostModalContainer();
    });
  }, [activeUser]);

  return (
    <HelmetProvider>
      <AppPage
        activeUser={activeUser}
        onLogout={logout}
        onRequestAuthModal={handleRequestAuthModal}
        onRequestNewPostModal={handleRequestNewPostModal}
      >
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<TimelineContainer />} path="/" />
            <Route
              element={
                <LazyDirectMessageListContainer
                  activeUser={activeUser}
                  onRequestAuthModal={handleRequestAuthModal}
                />
              }
              path="/dm"
            />
            <Route
              element={
                <LazyDirectMessageContainer
                  activeUser={activeUser}
                  onRequestAuthModal={handleRequestAuthModal}
                />
              }
              path="/dm/:conversationId"
            />
            <Route element={<LazySearchContainer />} path="/search" />
            <Route element={<LazyUserProfileContainer />} path="/users/:username" />
            <Route element={<LazyPostContainer />} path="/posts/:postId" />
            <Route element={<LazyTermContainer />} path="/terms" />
            <Route
              element={
                <LazyCrokContainer
                  activeUser={activeUser}
                  onRequestAuthModal={handleRequestAuthModal}
                />
              }
              path="/crok"
            />
            <Route element={<LazyNotFoundContainer />} path="*" />
          </Routes>
        </Suspense>
      </AppPage>
      <Suspense fallback={null}>
        {shouldLoadAuthModal ? (
          <LazyAuthModalContainer
            id={authModalId}
            onUpdateActiveUser={updateActiveUser}
            openRequestKey={authOpenRequestKey}
          />
        ) : null}
        {shouldLoadNewPostModal ? (
          <LazyNewPostModalContainer id={newPostModalId} openRequestKey={newPostOpenRequestKey} />
        ) : null}
      </Suspense>
    </HelmetProvider>
  );
};

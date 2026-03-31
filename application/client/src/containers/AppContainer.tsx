import { Suspense, lazy, useCallback, useEffect, useId, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

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
const LazyNewPostModalContainer = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer");
  return { default: module.NewPostModalContainer };
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
  const module = await import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer");
  return { default: module.UserProfileContainer };
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
        <Routes>
          <Route element={<TimelineContainer />} path="/" />
          <Route
            element={
              <Suspense fallback={<div className="text-cax-text-muted px-4 py-8 text-center">読み込み中...</div>}>
                <LazyDirectMessageListContainer activeUser={activeUser} authModalId={authModalId} />
              </Suspense>
            }
            path="/dm"
          />
          <Route
            element={
              <Suspense fallback={<div className="text-cax-text-muted px-4 py-8 text-center">読み込み中...</div>}>
                <LazyDirectMessageContainer activeUser={activeUser} authModalId={authModalId} />
              </Suspense>
            }
            path="/dm/:conversationId"
          />
          <Route
            element={
              <Suspense fallback={<div className="text-cax-text-muted px-4 py-8 text-center">読み込み中...</div>}>
                <LazySearchContainer />
              </Suspense>
            }
            path="/search"
          />
          <Route
            element={
              <Suspense fallback={<div className="text-cax-text-muted px-4 py-8 text-center">読み込み中...</div>}>
                <LazyUserProfileContainer />
              </Suspense>
            }
            path="/users/:username"
          />
          <Route
            element={
              <Suspense fallback={<div className="text-cax-text-muted px-4 py-8 text-center">読み込み中...</div>}>
                <LazyPostContainer />
              </Suspense>
            }
            path="/posts/:postId"
          />
          <Route
            element={
              <Suspense fallback={<div className="text-cax-text-muted px-4 py-8 text-center">読み込み中...</div>}>
                <LazyTermContainer />
              </Suspense>
            }
            path="/terms"
          />
          <Route
            element={
              <Suspense
                fallback={<div className="text-cax-text-muted px-4 py-8 text-center">読み込み中...</div>}
              >
                <LazyCrokContainer activeUser={activeUser} authModalId={authModalId} />
              </Suspense>
            }
            path="/crok"
          />
          <Route
            element={
              <Suspense fallback={<div className="text-cax-text-muted px-4 py-8 text-center">読み込み中...</div>}>
                <LazyNotFoundContainer />
              </Suspense>
            }
            path="*"
          />
        </Routes>
      </AppPage>

      <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
      <Suspense fallback={null}>
        <LazyNewPostModalContainer id={newPostModalId} />
      </Suspense>
    </HelmetProvider>
  );
};

import { Suspense, lazy, useCallback, useEffect, useId, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const TimelineContainer = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/containers/TimelineContainer");
  return { default: module.TimelineContainer };
});

const DirectMessageListContainer = lazy(async () => {
  const module =
    await import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer");
  return { default: module.DirectMessageListContainer };
});

const DirectMessageContainer = lazy(async () => {
  const module =
    await import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer");
  return { default: module.DirectMessageContainer };
});

const SearchContainer = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/containers/SearchContainer");
  return { default: module.SearchContainer };
});

const UserProfileContainer = lazy(async () => {
  const module =
    await import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer");
  return { default: module.UserProfileContainer };
});

const PostContainer = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/containers/PostContainer");
  return { default: module.PostContainer };
});

const TermContainer = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/containers/TermContainer");
  return { default: module.TermContainer };
});

const CrokContainer = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/containers/CrokContainer");
  return { default: module.CrokContainer };
});

const NotFoundContainer = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/containers/NotFoundContainer");
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
  const routeFallback = (
    <div className="text-cax-text-muted flex min-h-screen items-center justify-center p-6">
      読み込み中...
    </div>
  );

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
        <Suspense fallback={routeFallback}>
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

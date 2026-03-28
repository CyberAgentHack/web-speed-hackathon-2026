import { Suspense, lazy, useCallback, useEffect, useId, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const TimelineContainerLazy = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/containers/TimelineContainer");
  return { default: module.TimelineContainer };
});
const DirectMessageListContainerLazy = lazy(async () => {
  const module = await import(
    "@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer"
  );
  return { default: module.DirectMessageListContainer };
});
const DirectMessageContainerLazy = lazy(async () => {
  const module = await import(
    "@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer"
  );
  return { default: module.DirectMessageContainer };
});
const SearchContainerLazy = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/containers/SearchContainer");
  return { default: module.SearchContainer };
});
const UserProfileContainerLazy = lazy(async () => {
  const module = await import(
    "@web-speed-hackathon-2026/client/src/containers/UserProfileContainer"
  );
  return { default: module.UserProfileContainer };
});
const PostContainerLazy = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/containers/PostContainer");
  return { default: module.PostContainer };
});
const TermContainerLazy = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/containers/TermContainer");
  return { default: module.TermContainer };
});
const CrokContainerLazy = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/containers/CrokContainer");
  return { default: module.CrokContainer };
});
const NotFoundContainerLazy = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/containers/NotFoundContainer");
  return { default: module.NotFoundContainer };
});
const NewPostModalContainerLazy = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer");
  return { default: module.NewPostModalContainer };
});

const LoadingFallback = () => {
  return (
    <>
      <Helmet>
        <title>読込中 - CaX</title>
      </Helmet>
      <div className="p-4">
        <p className="text-cax-text-muted text-sm">読込中...</p>
      </div>
    </>
  );
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
      .catch(() => {
        setActiveUser(null);
      });
  }, []);
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
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route element={<TimelineContainerLazy />} path="/" />
            <Route
              element={
                <DirectMessageListContainerLazy activeUser={activeUser} authModalId={authModalId} />
              }
              path="/dm"
            />
            <Route
              element={
                <DirectMessageContainerLazy activeUser={activeUser} authModalId={authModalId} />
              }
              path="/dm/:conversationId"
            />
            <Route element={<SearchContainerLazy />} path="/search" />
            <Route element={<UserProfileContainerLazy />} path="/users/:username" />
            <Route element={<PostContainerLazy />} path="/posts/:postId" />
            <Route element={<TermContainerLazy />} path="/terms" />
            <Route
              element={<CrokContainerLazy activeUser={activeUser} authModalId={authModalId} />}
              path="/crok"
            />
            <Route element={<NotFoundContainerLazy />} path="*" />
          </Routes>
        </Suspense>
      </AppPage>

      <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
      {activeUser !== null ? (
        <Suspense fallback={null}>
          <NewPostModalContainerLazy id={newPostModalId} />
        </Suspense>
      ) : null}
    </HelmetProvider>
  );
};

import { lazy, Suspense, useCallback, useEffect, useId, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const TimelineContainer = lazy(async () => ({
  default: (await import("@web-speed-hackathon-2026/client/src/containers/TimelineContainer"))
    .TimelineContainer,
}));

const DirectMessageListContainer = lazy(async () => ({
  default: (
    await import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer")
  ).DirectMessageListContainer,
}));

const DirectMessageContainer = lazy(async () => ({
  default: (
    await import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer")
  ).DirectMessageContainer,
}));

const SearchContainer = lazy(async () => ({
  default: (await import("@web-speed-hackathon-2026/client/src/containers/SearchContainer"))
    .SearchContainer,
}));

const UserProfileContainer = lazy(async () => ({
  default: (await import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer"))
    .UserProfileContainer,
}));

const PostContainer = lazy(async () => ({
  default: (await import("@web-speed-hackathon-2026/client/src/containers/PostContainer"))
    .PostContainer,
}));

const TermContainer = lazy(async () => ({
  default: (await import("@web-speed-hackathon-2026/client/src/containers/TermContainer"))
    .TermContainer,
}));

const CrokContainer = lazy(async () => ({
  default: (await import("@web-speed-hackathon-2026/client/src/containers/CrokContainer"))
    .CrokContainer,
}));

const NotFoundContainer = lazy(async () => ({
  default: (await import("@web-speed-hackathon-2026/client/src/containers/NotFoundContainer"))
    .NotFoundContainer,
}));

const AuthModalContainer = lazy(async () => ({
  default: (await import("@web-speed-hackathon-2026/client/src/containers/AuthModalContainer"))
    .AuthModalContainer,
}));

const NewPostModalContainer = lazy(async () => ({
  default: (await import("@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer"))
    .NewPostModalContainer,
}));

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
              element={
                <DirectMessageContainer activeUser={activeUser} authModalId={authModalId} />
              }
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

      <Suspense fallback={null}>
        <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
        <NewPostModalContainer id={newPostModalId} />
      </Suspense>
    </HelmetProvider>
  );
};

import { lazy, Suspense, useCallback, useEffect, useId, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const DirectMessageListContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer").then(
    (mod) => ({ default: mod.DirectMessageListContainer }),
  ),
);
const DirectMessageContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer").then((mod) => ({
    default: mod.DirectMessageContainer,
  })),
);
const SearchContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/SearchContainer").then((mod) => ({
    default: mod.SearchContainer,
  })),
);
const UserProfileContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then((mod) => ({
    default: mod.UserProfileContainer,
  })),
);
const PostContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/PostContainer").then((mod) => ({
    default: mod.PostContainer,
  })),
);
const TermContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/TermContainer").then((mod) => ({
    default: mod.TermContainer,
  })),
);
const CrokContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then((mod) => ({
    default: mod.CrokContainer,
  })),
);
const NewPostModalContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer").then((mod) => ({
    default: mod.NewPostModalContainer,
  })),
);

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  const [isLoadingActiveUser, setIsLoadingActiveUser] = useState(true);
  const [isAuthFlowThrottled, setIsAuthFlowThrottled] = useState(false);
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
    // 認証フロー再開中はホームへの遷移直後だけ重いタイムライン取得を抑制する
    setIsAuthFlowThrottled(true);
    navigate("/");
  }, [navigate]);

  useEffect(() => {
    if (!isAuthFlowThrottled) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsAuthFlowThrottled(false);
    }, 12 * 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isAuthFlowThrottled]);

  const handleUpdateActiveUser = useCallback((user: Models.User) => {
    setActiveUser(user);
    setIsAuthFlowThrottled(false);
  }, []);

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
          <Route element={<TimelineContainer suppressHeavyMedia={isAuthFlowThrottled} />} path="/" />
          <Route
            element={
              <Suspense fallback={null}>
                <DirectMessageListContainer activeUser={activeUser} authModalId={authModalId} />
              </Suspense>
            }
            path="/dm"
          />
          <Route
            element={
              <Suspense fallback={null}>
                <DirectMessageContainer activeUser={activeUser} authModalId={authModalId} />
              </Suspense>
            }
            path="/dm/:conversationId"
          />
          <Route
            element={
              <Suspense fallback={null}>
                <SearchContainer />
              </Suspense>
            }
            path="/search"
          />
          <Route
            element={
              <Suspense fallback={null}>
                <UserProfileContainer />
              </Suspense>
            }
            path="/users/:username"
          />
          <Route
            element={
              <Suspense fallback={null}>
                <PostContainer />
              </Suspense>
            }
            path="/posts/:postId"
          />
          <Route
            element={
              <Suspense fallback={null}>
                <TermContainer />
              </Suspense>
            }
            path="/terms"
          />
          <Route
            element={
              <Suspense fallback={null}>
                <CrokContainer activeUser={activeUser} authModalId={authModalId} />
              </Suspense>
            }
            path="/crok"
          />
          <Route element={<NotFoundContainer />} path="*" />
        </Routes>
      </AppPage>

      <AuthModalContainer id={authModalId} onUpdateActiveUser={handleUpdateActiveUser} />
      <Suspense fallback={null}>
        <NewPostModalContainer id={newPostModalId} />
      </Suspense>
    </HelmetProvider>
  );
};

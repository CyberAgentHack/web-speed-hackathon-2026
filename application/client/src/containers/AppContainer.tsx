import { Suspense, lazy, useCallback, useEffect, useId, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const TimelinePage = lazy(() =>
  import(
    /* webpackChunkName: "timeline-page" */ "@web-speed-hackathon-2026/client/src/containers/TimelineContainer"
  ).then(({ TimelineContainer }) => ({ default: TimelineContainer })),
);
const DirectMessageListPage = lazy(() =>
  import(
    /* webpackChunkName: "direct-message-list-page" */ "@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer"
  ).then(({ DirectMessageListContainer }) => ({ default: DirectMessageListContainer })),
);
const DirectMessagePage = lazy(() =>
  import(
    /* webpackChunkName: "direct-message-page" */ "@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer"
  ).then(({ DirectMessageContainer }) => ({ default: DirectMessageContainer })),
);
const SearchPage = lazy(() =>
  import(
    /* webpackChunkName: "search-page" */ "@web-speed-hackathon-2026/client/src/containers/SearchContainer"
  ).then(({ SearchContainer }) => ({ default: SearchContainer })),
);
const UserProfilePage = lazy(() =>
  import(
    /* webpackChunkName: "user-profile-page" */ "@web-speed-hackathon-2026/client/src/containers/UserProfileContainer"
  ).then(({ UserProfileContainer }) => ({ default: UserProfileContainer })),
);
const PostPage = lazy(() =>
  import(
    /* webpackChunkName: "post-page" */ "@web-speed-hackathon-2026/client/src/containers/PostContainer"
  ).then(({ PostContainer }) => ({ default: PostContainer })),
);
const TermPage = lazy(() =>
  import(
    /* webpackChunkName: "terms-page" */ "@web-speed-hackathon-2026/client/src/containers/TermContainer"
  ).then(({ TermContainer }) => ({ default: TermContainer })),
);
const CrokPage = lazy(() =>
  import(
    /* webpackChunkName: "crok-page" */ "@web-speed-hackathon-2026/client/src/containers/CrokContainer"
  ).then(({ CrokContainer }) => ({ default: CrokContainer })),
);
const NotFoundPage = lazy(() =>
  import(
    /* webpackChunkName: "not-found-page" */ "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer"
  ).then(({ NotFoundContainer }) => ({ default: NotFoundContainer })),
);

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null | "loading">("loading");
  useEffect(() => {
    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        setActiveUser(user);
      })
      .catch(() => {
        setActiveUser(null);
      });
  }, [setActiveUser]);
  const handleLogout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    setActiveUser(null);
    navigate("/");
  }, [navigate]);

  const authModalId = useId();
  const newPostModalId = useId();
  const routeFallback = (
    <Helmet>
      <title>読込中 - CaX</title>
    </Helmet>
  );

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
            <Route element={<TimelinePage />} path="/" />
            <Route
              element={<DirectMessageListPage activeUser={activeUser} authModalId={authModalId} />}
              path="/dm"
            />
            <Route
              element={<DirectMessagePage activeUser={activeUser} authModalId={authModalId} />}
              path="/dm/:conversationId"
            />
            <Route element={<SearchPage />} path="/search" />
            <Route element={<UserProfilePage />} path="/users/:username" />
            <Route element={<PostPage />} path="/posts/:postId" />
            <Route element={<TermPage />} path="/terms" />
            <Route
              element={<CrokPage activeUser={activeUser} authModalId={authModalId} />}
              path="/crok"
            />
            <Route element={<NotFoundPage />} path="*" />
          </Routes>
        </Suspense>
      </AppPage>

      <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
      <NewPostModalContainer id={newPostModalId} />
    </HelmetProvider>
  );
};

import { useCallback, useEffect, useId, useState, Suspense, lazy } from "react";
import { HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import {
  fetchJSON,
  sendJSON,
} from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const AuthModalContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/AuthModalContainer").then(
    (m) => ({
      default: m.AuthModalContainer,
    }),
  ),
);

const NewPostModalContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer").then(
    (m) => ({
      default: m.NewPostModalContainer,
    }),
  ),
);

const TimelineContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/TimelineContainer").then(
    (m) => ({
      default: m.TimelineContainer,
    }),
  ),
);

const DirectMessageListContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer").then(
    (m) => ({
      default: m.DirectMessageListContainer,
    }),
  ),
);

const DirectMessageContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer").then(
    (m) => ({
      default: m.DirectMessageContainer,
    }),
  ),
);

const SearchContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/SearchContainer").then(
    (m) => ({
      default: m.SearchContainer,
    }),
  ),
);

const UserProfileContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then(
    (m) => ({
      default: m.UserProfileContainer,
    }),
  ),
);

const PostContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/PostContainer").then(
    (m) => ({
      default: m.PostContainer,
    }),
  ),
);

const TermContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/TermContainer").then(
    (m) => ({
      default: m.TermContainer,
    }),
  ),
);

const CrokContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then(
    (m) => ({
      default: m.CrokContainer,
    }),
  ),
);

const NotFoundContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/NotFoundContainer").then(
    (m) => ({
      default: m.NotFoundContainer,
    }),
  ),
);

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        if (!cancelled) setActiveUser(user);
      })
      .catch(() => {
        if (!cancelled) setActiveUser(null);
      });

    return () => {
      cancelled = true;
    };
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
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<TimelineContainer />} />
            <Route
              path="/dm"
              element={
                <DirectMessageListContainer
                  activeUser={activeUser}
                  authModalId={authModalId}
                />
              }
            />
            <Route
              path="/dm/:conversationId"
              element={
                <DirectMessageContainer
                  activeUser={activeUser}
                  authModalId={authModalId}
                />
              }
            />
            <Route path="/search" element={<SearchContainer />} />
            <Route path="/users/:username" element={<UserProfileContainer />} />
            <Route path="/posts/:postId" element={<PostContainer />} />
            <Route path="/terms" element={<TermContainer />} />
            <Route
              path="/crok"
              element={
                <CrokContainer
                  activeUser={activeUser}
                  authModalId={authModalId}
                />
              }
            />
            <Route path="*" element={<NotFoundContainer />} />
          </Routes>
        </Suspense>
      </AppPage>

      <Suspense fallback={null}>
        <AuthModalContainer
          id={authModalId}
          onUpdateActiveUser={setActiveUser}
        />
        <NewPostModalContainer id={newPostModalId} />
      </Suspense>
    </HelmetProvider>
  );
};

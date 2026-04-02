import { lazy, Suspense, useCallback, useEffect, useId, useState } from "react";
import { HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const TimelineContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/TimelineContainer").then((module) => ({
    default: module.TimelineContainer,
  })),
);
const SearchContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/SearchContainer").then((module) => ({
    default: module.SearchContainer,
  })),
);

const DirectMessageListContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer").then(
    (module) => ({ default: module.DirectMessageListContainer }),
  ),
);
const DirectMessageContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer").then(
    (module) => ({
      default: module.DirectMessageContainer,
    }),
  ),
);
const UserProfileContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then((module) => ({
    default: module.UserProfileContainer,
  })),
);
const PostContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/PostContainer").then((module) => ({
    default: module.PostContainer,
  })),
);
const TermContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/TermContainer").then((module) => ({
    default: module.TermContainer,
  })),
);
const CrokContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then((module) => ({
    default: module.CrokContainer,
  })),
);

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (pathname !== "") {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetchJSON<Models.User>("/api/v1/me").then((user) => {
      if (cancelled) {
        return;
      }
      setActiveUser(user);
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

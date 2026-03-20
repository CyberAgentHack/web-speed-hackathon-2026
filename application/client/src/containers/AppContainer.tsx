import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const CrokContainer = lazy(() =>
  import("./CrokContainer").then((m) => ({ default: m.CrokContainer })),
);
const DirectMessageContainer = lazy(() =>
  import("./DirectMessageContainer").then((m) => ({ default: m.DirectMessageContainer })),
);
const DirectMessageListContainer = lazy(() =>
  import("./DirectMessageListContainer").then((m) => ({
    default: m.DirectMessageListContainer,
  })),
);
const NotFoundContainer = lazy(() =>
  import("./NotFoundContainer").then((m) => ({ default: m.NotFoundContainer })),
);
const PostContainer = lazy(() =>
  import("./PostContainer").then((m) => ({ default: m.PostContainer })),
);
const SearchContainer = lazy(() =>
  import("./SearchContainer").then((m) => ({ default: m.SearchContainer })),
);
const TermContainer = lazy(() =>
  import("./TermContainer").then((m) => ({ default: m.TermContainer })),
);
const TimelineContainer = lazy(() =>
  import("./TimelineContainer").then((m) => ({ default: m.TimelineContainer })),
);
const UserProfileContainer = lazy(() =>
  import("./UserProfileContainer").then((m) => ({ default: m.UserProfileContainer })),
);

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

  const authModalId = "auth-modal";
  const newPostModalId = "new-post-modal";

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

      <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
      <NewPostModalContainer id={newPostModalId} />
    </HelmetProvider>
  );
};

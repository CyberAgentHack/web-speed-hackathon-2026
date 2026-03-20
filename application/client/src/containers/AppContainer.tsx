import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const AuthModalContainer = lazy(() =>
  import("./AuthModalContainer").then((m) => ({ default: m.AuthModalContainer })),
);
const NewPostModalContainer = lazy(() =>
  import("./NewPostModalContainer").then((m) => ({ default: m.NewPostModalContainer })),
);
const CrokContainer = lazy(() =>
  import(/* webpackPrefetch: true */ "./CrokContainer").then((m) => ({ default: m.CrokContainer })),
);
const DirectMessageContainer = lazy(() =>
  import(/* webpackPrefetch: true */ "./DirectMessageContainer").then((m) => ({ default: m.DirectMessageContainer })),
);
const DirectMessageListContainer = lazy(() =>
  import(/* webpackPrefetch: true */ "./DirectMessageListContainer").then((m) => ({
    default: m.DirectMessageListContainer,
  })),
);
const NotFoundContainer = lazy(() =>
  import("./NotFoundContainer").then((m) => ({ default: m.NotFoundContainer })),
);
const PostContainer = lazy(() =>
  import(/* webpackPrefetch: true */ "./PostContainer").then((m) => ({ default: m.PostContainer })),
);
const SearchContainer = lazy(() =>
  import(/* webpackPrefetch: true */ "./SearchContainer").then((m) => ({ default: m.SearchContainer })),
);
const TermContainer = lazy(() =>
  import(/* webpackPrefetch: true */ "./TermContainer").then((m) => ({ default: m.TermContainer })),
);
const TimelineContainer = lazy(() =>
  import("./TimelineContainer").then((m) => ({ default: m.TimelineContainer })),
);
const UserProfileContainer = lazy(() =>
  import(/* webpackPrefetch: true */ "./UserProfileContainer").then((m) => ({ default: m.UserProfileContainer })),
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

  useEffect(() => {
    if (isLoadingActiveUser) {
      document.title = "読込中 - CaX";
    }
  }, [isLoadingActiveUser]);

  if (isLoadingActiveUser) {
    return null;
  }

  return (
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

      <Suspense fallback={null}>
        <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
        <NewPostModalContainer id={newPostModalId} />
      </Suspense>
    </AppPage>
  );
};

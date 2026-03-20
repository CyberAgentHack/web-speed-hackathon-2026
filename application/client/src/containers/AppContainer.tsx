import { lazy, Suspense, useCallback, useEffect, useId, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const TimelineContainer = lazy(() =>
  import("./TimelineContainer").then((m) => ({
    default: m.TimelineContainer,
  })),
);
const DirectMessageListContainer = lazy(() =>
  import("./DirectMessageListContainer").then((m) => ({
    default: m.DirectMessageListContainer,
  })),
);
const DirectMessageContainer = lazy(() =>
  import("./DirectMessageContainer").then((m) => ({
    default: m.DirectMessageContainer,
  })),
);
const SearchContainer = lazy(() =>
  import("./SearchContainer").then((m) => ({
    default: m.SearchContainer,
  })),
);
const UserProfileContainer = lazy(() =>
  import("./UserProfileContainer").then((m) => ({
    default: m.UserProfileContainer,
  })),
);
const PostContainer = lazy(() =>
  import("./PostContainer").then((m) => ({
    default: m.PostContainer,
  })),
);
const TermContainer = lazy(() =>
  import("./TermContainer").then((m) => ({
    default: m.TermContainer,
  })),
);
const CrokContainer = lazy(() =>
  import("./CrokContainer").then((m) => ({
    default: m.CrokContainer,
  })),
);
const NotFoundContainer = lazy(() =>
  import("./NotFoundContainer").then((m) => ({
    default: m.NotFoundContainer,
  })),
);

const RouteFallback = () => (
  <>
    <Helmet>
      <title>読込中 - CaX</title>
    </Helmet>
    <div className="text-cax-text p-4">読込中…</div>
  </>
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
        <Suspense fallback={<RouteFallback />}>
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

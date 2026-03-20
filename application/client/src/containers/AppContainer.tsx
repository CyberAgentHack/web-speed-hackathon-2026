import { lazy, Suspense, useCallback, useEffect, useId, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const AuthModalContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/AuthModalContainer").then((m) => ({
    default: m.AuthModalContainer,
  })),
);
const NewPostModalContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer").then((m) => ({
    default: m.NewPostModalContainer,
  })),
);

const TimelineContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/TimelineContainer").then((m) => ({
    default: m.TimelineContainer,
  })),
);
const DirectMessageListContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer").then(
    (m) => ({ default: m.DirectMessageListContainer }),
  ),
);
const DirectMessageContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer").then((m) => ({
    default: m.DirectMessageContainer,
  })),
);
const SearchContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/SearchContainer").then((m) => ({
    default: m.SearchContainer,
  })),
);
const UserProfileContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then((m) => ({
    default: m.UserProfileContainer,
  })),
);
const PostContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/PostContainer").then((m) => ({
    default: m.PostContainer,
  })),
);
const TermContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/TermContainer").then((m) => ({
    default: m.TermContainer,
  })),
);
const CrokContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then((m) => ({
    default: m.CrokContainer,
  })),
);
const NotFoundContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/NotFoundContainer").then((m) => ({
    default: m.NotFoundContainer,
  })),
);

export interface SSRData {
  activeUser?: Models.User | null;
  posts?: Models.Post[];
  post?: Models.Post | null;
  comments?: Models.Comment[];
  user?: Models.User | null;
  userPosts?: Models.Post[];
}

interface AppContainerProps {
  ssrData?: SSRData;
}

export const AppContainer = ({ ssrData }: AppContainerProps) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const hasSSRActiveUser = ssrData != null && "activeUser" in ssrData;
  const [activeUser, setActiveUser] = useState<Models.User | null>(
    hasSSRActiveUser ? (ssrData.activeUser ?? null) : null,
  );
  const [isLoadingActiveUser, setIsLoadingActiveUser] = useState(!hasSSRActiveUser);
  useEffect(() => {
    if (hasSSRActiveUser) return;
    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        setActiveUser(user);
      })
      .finally(() => {
        setIsLoadingActiveUser(false);
      });
  }, [hasSSRActiveUser]);
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
            <Route element={<TimelineContainer ssrPosts={ssrData?.posts} />} path="/" />
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
            <Route element={<SearchContainer ssrPosts={ssrData?.posts} />} path="/search" />
            <Route
              element={<UserProfileContainer ssrUser={ssrData?.user} ssrPosts={ssrData?.userPosts} />}
              path="/users/:username"
            />
            <Route
              element={<PostContainer ssrPost={ssrData?.post} ssrComments={ssrData?.comments} />}
              path="/posts/:postId"
            />
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

import React, { Suspense, useCallback, useEffect, useId, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { apiClient } from "@web-speed-hackathon-2026/client/src/api/client";
import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";

const AuthModalContainer = React.lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/AuthModalContainer").then((m) => ({
    default: m.AuthModalContainer,
  })),
);
const CrokContainer = React.lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then((m) => ({
    default: m.CrokContainer,
  })),
);
const DirectMessageContainer = React.lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer").then((m) => ({
    default: m.DirectMessageContainer,
  })),
);
const DirectMessageListContainer = React.lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer").then(
    (m) => ({ default: m.DirectMessageListContainer }),
  ),
);
const NewPostModalContainer = React.lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer").then((m) => ({
    default: m.NewPostModalContainer,
  })),
);
const NotFoundContainer = React.lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/NotFoundContainer").then((m) => ({
    default: m.NotFoundContainer,
  })),
);
const PostContainer = React.lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/PostContainer").then((m) => ({
    default: m.PostContainer,
  })),
);
const SearchContainer = React.lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/SearchContainer").then((m) => ({
    default: m.SearchContainer,
  })),
);
const TermContainer = React.lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/TermContainer").then((m) => ({
    default: m.TermContainer,
  })),
);
const TimelineContainer = React.lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/TimelineContainer").then((m) => ({
    default: m.TimelineContainer,
  })),
);
const UserProfileContainer = React.lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then((m) => ({
    default: m.UserProfileContainer,
  })),
);

export interface SSRData {
  activeUser?: Models.User | null | undefined;
  posts?: Models.Post[] | undefined;
  post?: Models.Post | null | undefined;
  comments?: Models.Comment[] | undefined;
  user?: Models.User | null | undefined;
  userPosts?: Models.Post[] | undefined;
}

interface AppContainerProps {
  ssrData?: SSRData | undefined;
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
    void apiClient.me
      .$get()
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((user) => {
        setActiveUser(user);
      })
      .catch(() => {
        // 401 or network error — user is not authenticated
      })
      .finally(() => {
        setIsLoadingActiveUser(false);
      });
  }, [hasSSRActiveUser]);
  const handleLogout = useCallback(async () => {
    await apiClient.signout.$post();
    setActiveUser(null);
    void navigate("/");
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
              element={
                <UserProfileContainer ssrUser={ssrData?.user} ssrPosts={ssrData?.userPosts} />
              }
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
      </Suspense>
      <Suspense fallback={null}>
        <NewPostModalContainer id={newPostModalId} />
      </Suspense>
    </HelmetProvider>
  );
};

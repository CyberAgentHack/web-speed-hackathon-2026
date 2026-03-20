import React, { Suspense, useCallback, useEffect, useId, useRef } from "react";

import { Route, Routes, useLocation, useNavigate } from "react-router";
import useSWR, { useSWRConfig } from "swr";

import { apiClient } from "@web-speed-hackathon-2026/client/src/api/client";
import { getSSRData } from "@web-speed-hackathon-2026/client/src/api/ssr-data";
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
  sentiment?: { score: number; label: string } | null | undefined;
}

const activeUserFetcher = async (_key: string): Promise<Models.User | null> => {
  const res = await fetch("/api/v1/me");
  if (!res.ok) return null;
  return res.json() as Promise<Models.User>;
};

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { mutate } = useSWRConfig();
  const ssrRef = useRef(getSSRData());
  const ssrActiveUser = ssrRef.current?.activeUser;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const { data: activeUser, isLoading: isLoadingActiveUser } = useSWR<
    Models.User | null,
    Error,
    string
  >(
    "/api/v1/me",
    activeUserFetcher,
    ssrActiveUser !== undefined
      ? { fallbackData: ssrActiveUser ?? null, revalidateOnMount: false }
      : undefined,
  );

  const setActiveUser = useCallback(
    (user: Models.User | null) => {
      void mutate("/api/v1/me", user, false);
    },
    [mutate],
  );

  const handleLogout = useCallback(async () => {
    await apiClient.signout.$post();
    void mutate("/api/v1/me", null, false);
    void navigate("/");
  }, [mutate, navigate]);

  const authModalId = useId();
  const newPostModalId = useId();

  if (typeof window !== "undefined" && isLoadingActiveUser) {
    return <title>読込中 - CaX</title>;
  }

  const resolvedActiveUser = activeUser ?? null;

  return (
    <>
      <AppPage
        activeUser={resolvedActiveUser}
        authModalId={authModalId}
        newPostModalId={newPostModalId}
        onLogout={handleLogout}
      >
        <Suspense fallback={null}>
          <Routes>
            <Route element={<TimelineContainer />} path="/" />
            <Route
              element={
                <DirectMessageListContainer
                  activeUser={resolvedActiveUser}
                  authModalId={authModalId}
                />
              }
              path="/dm"
            />
            <Route
              element={
                <DirectMessageContainer activeUser={resolvedActiveUser} authModalId={authModalId} />
              }
              path="/dm/:conversationId"
            />
            <Route element={<SearchContainer />} path="/search" />
            <Route element={<UserProfileContainer />} path="/users/:username" />
            <Route element={<PostContainer />} path="/posts/:postId" />
            <Route element={<TermContainer />} path="/terms" />
            <Route
              element={<CrokContainer activeUser={resolvedActiveUser} authModalId={authModalId} />}
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
    </>
  );
};

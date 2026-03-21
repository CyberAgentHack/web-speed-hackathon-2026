/**
 * SSR 専用の AppContainer。
 * React.lazy() を使わず static import にすることで、
 * SSR ビルドが単一ファイルになり module 変数を全コンポーネントで共有できる。
 * クライアント側は AppContainer.tsx (React.lazy 版) を使う。
 */
import { useCallback } from "react";
import { Route, Routes, useNavigate } from "react-router";
import useSWR, { useSWRConfig } from "swr";

import { apiClient } from "@web-speed-hackathon-2026/client/src/api/client";
import { useSSRData } from "@web-speed-hackathon-2026/client/src/api/ssr-context";
import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { CrokContainer } from "@web-speed-hackathon-2026/client/src/containers/CrokContainer";
import { DirectMessageContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer";
import { DirectMessageListContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { PostContainer } from "@web-speed-hackathon-2026/client/src/containers/PostContainer";
import { SearchContainer } from "@web-speed-hackathon-2026/client/src/containers/SearchContainer";
import { TermContainer } from "@web-speed-hackathon-2026/client/src/containers/TermContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { UserProfileContainer } from "@web-speed-hackathon-2026/client/src/containers/UserProfileContainer";

export type { SSRData } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";

const activeUserFetcher = async (_key: string): Promise<Models.User | null> => {
  const res = await fetch("/api/v1/me");
  if (!res.ok) return null;
  return res.json() as Promise<Models.User>;
};

export const AppContainer = () => {
  const navigate = useNavigate();
  const { mutate } = useSWRConfig();
  const ssrData = useSSRData();
  const ssrActiveUser = ssrData?.activeUser;

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

  const authModalId = "auth-modal";
  const newPostModalId = "new-post-modal";

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
      </AppPage>

      <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
      <NewPostModalContainer id={newPostModalId} />
    </>
  );
};

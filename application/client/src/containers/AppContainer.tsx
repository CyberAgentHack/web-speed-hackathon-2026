import { useCallback, useEffect, useId, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

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
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

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
      </AppPage>

      <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
      <NewPostModalContainer id={newPostModalId} />
    </HelmetProvider>
  );
};

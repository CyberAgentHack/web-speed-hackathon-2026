import { Suspense, lazy, useCallback, useEffect, useId, useRef, useState } from "react";
import { HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { DirectMessageContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer";
import { DirectMessageListContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { PostLoadingPlaceholder } from "@web-speed-hackathon-2026/client/src/containers/PostContainer";
import { SearchContainer } from "@web-speed-hackathon-2026/client/src/containers/SearchContainer";
import { TermContainer } from "@web-speed-hackathon-2026/client/src/containers/TermContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
const CrokContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then((module) => ({
    default: module.CrokContainer,
  })),
);
const TimelineContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/TimelineContainer").then((module) => ({
    default: module.TimelineContainer,
  })),
);
const UserProfileContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then(
    (module) => ({
      default: module.UserProfileContainer,
    }),
  ),
);
const PostContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/PostContainer").then((module) => ({
    default: module.PostContainer,
  })),
);

export const AppContainer = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  const ignoreInitialMeRequestRef = useRef(false);
  useEffect(() => {
    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        if (!ignoreInitialMeRequestRef.current) {
          setActiveUser(user);
        }
      })
      .catch(() => {
        if (!ignoreInitialMeRequestRef.current) {
          setActiveUser(null);
        }
      });
  }, [setActiveUser]);
  const handleLogout = useCallback(async () => {
    ignoreInitialMeRequestRef.current = true;
    await sendJSON("/api/v1/signout", {});
    setActiveUser(null);
  }, []);

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
        <Routes>
          <Route
            element={
              <Suspense fallback={null}>
                <TimelineContainer />
              </Suspense>
            }
            path="/"
          />
          <Route
            element={<DirectMessageListContainer activeUser={activeUser} authModalId={authModalId} />}
            path="/dm"
          />
          <Route
            element={<DirectMessageContainer activeUser={activeUser} authModalId={authModalId} />}
            path="/dm/:conversationId"
          />
          <Route element={<SearchContainer />} path="/search" />
          <Route
            element={
              <Suspense fallback={null}>
                <UserProfileContainer />
              </Suspense>
            }
            path="/users/:username"
          />
          <Route
            element={
              <Suspense fallback={<PostLoadingPlaceholder />}>
                <PostContainer />
              </Suspense>
            }
            path="/posts/:postId"
          />
          <Route element={<TermContainer />} path="/terms" />
          <Route
            element={
              <Suspense fallback={null}>
                <CrokContainer activeUser={activeUser} authModalId={authModalId} />
              </Suspense>
            }
            path="/crok"
          />
          <Route element={<NotFoundContainer />} path="*" />
        </Routes>
      </AppPage>

      <AuthModalContainer
        id={authModalId}
        onUpdateActiveUser={(user) => {
          ignoreInitialMeRequestRef.current = true;
          setActiveUser(user);
        }}
      />
      <NewPostModalContainer id={newPostModalId} />
    </HelmetProvider>
  );
};

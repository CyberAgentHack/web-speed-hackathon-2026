import { lazy, Suspense, useCallback, useEffect, useId, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { useTitle } from "@web-speed-hackathon-2026/client/src/hooks/use_title";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const AuthModalContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/AuthModalContainer").then(m => ({ default: m.AuthModalContainer })));
const NewPostModalContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer").then(m => ({ default: m.NewPostModalContainer })));
const SearchContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/SearchContainer").then(m => ({ default: m.SearchContainer })));
const CrokContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then(m => ({ default: m.CrokContainer })));
const DirectMessageContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer").then(m => ({ default: m.DirectMessageContainer })));
const DirectMessageListContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer").then(m => ({ default: m.DirectMessageListContainer })));
const NotFoundContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/NotFoundContainer").then(m => ({ default: m.NotFoundContainer })));
const PostContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/PostContainer").then(m => ({ default: m.PostContainer })));
const TermContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/TermContainer").then(m => ({ default: m.TermContainer })));
const TimelineContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/TimelineContainer").then(m => ({ default: m.TimelineContainer })));
const UserProfileContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then(m => ({ default: m.UserProfileContainer })));

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
      .catch(() => {})
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

  useTitle("CaX");

  return (
    <>
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

      <Suspense fallback={null}>
        <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
        <NewPostModalContainer id={newPostModalId} />
      </Suspense>
    </>
  );
};

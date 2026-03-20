import { lazy, Suspense, useCallback, useEffect, useId, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const lazyNamed = <T extends Record<string, any>>(
  factory: () => Promise<T>,
  name: keyof T,
) => lazy(() => factory().then((m) => ({ default: m[name] })));

const CrokContainer = lazyNamed(() => import("@web-speed-hackathon-2026/client/src/containers/CrokContainer"), "CrokContainer");
const DirectMessageContainer = lazyNamed(() => import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer"), "DirectMessageContainer");
const DirectMessageListContainer = lazyNamed(() => import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer"), "DirectMessageListContainer");
const NotFoundContainer = lazyNamed(() => import("@web-speed-hackathon-2026/client/src/containers/NotFoundContainer"), "NotFoundContainer");
const PostContainer = lazyNamed(() => import("@web-speed-hackathon-2026/client/src/containers/PostContainer"), "PostContainer");
const SearchContainer = lazyNamed(() => import("@web-speed-hackathon-2026/client/src/containers/SearchContainer"), "SearchContainer");
const TermContainer = lazyNamed(() => import("@web-speed-hackathon-2026/client/src/containers/TermContainer"), "TermContainer");
const UserProfileContainer = lazyNamed(() => import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer"), "UserProfileContainer");

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  useEffect(() => {
    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        setActiveUser(user);
      })
      .catch(() => {
        // Not logged in
      });
  }, []);
  const handleLogout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    setActiveUser(null);
    navigate("/");
  }, [navigate]);

  const authModalId = useId();
  const newPostModalId = useId();


  return (
    <>
      <AppPage
        activeUser={activeUser}
        authModalId={authModalId}
        newPostModalId={newPostModalId}
        onLogout={handleLogout}
      >
        <Suspense fallback={
          <div className="px-4 py-4">
            <div className="h-32 w-full rounded-lg bg-cax-surface-subtle mb-2" />
            <div className="h-32 w-full rounded-lg bg-cax-surface-subtle mb-2" />
            <div className="h-32 w-full rounded-lg bg-cax-surface-subtle" />
          </div>
        }>
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
    </>
  );
};

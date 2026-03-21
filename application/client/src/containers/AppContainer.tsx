import React, { Suspense, useCallback, useEffect, useState } from "react";
import { TimelineItemSkeleton } from "../components/timeline/TimelineItemSkeleton";
import { HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import AuthModalContainer from "./AuthModalContainer";
import NewPostModalContainer from "./NewPostModalContainer";
import { fetchJSON, sendJSON } from "../utils/fetchers";
// import TimelineContainer from "./TimelineContainer";

const CrokContainer = React.lazy(() =>
  import(/* webpackChunkName: "Crok", webpackPreload: true */ "./CrokContainer"),
);
const DirectMessageContainer = React.lazy(() =>
  import(/* webpackChunkName: "DM", webpackPreload: true */ "./DirectMessageContainer"),
);
const DirectMessageListContainer = React.lazy(() =>
  import(/* webpackChunkName: "DMList", webpackPreload: true */ "./DirectMessageListContainer"),
);
const NotFoundContainer = React.lazy(() =>
  import(/* webpackChunkName: "NotFound" */ "./NotFoundContainer"),
);
import PostContainer from "./PostContainer";
const SearchContainer = React.lazy(() =>
  import(/* webpackChunkName: "Search", webpackPreload: true */ "./SearchContainer"),
);
const TermContainer = React.lazy(() =>
  import(/* webpackChunkName: "Term", webpackPreload: true */ "./TermContainer"),
);
// Static import for LCP optimization
import TimelineContainer from "./TimelineContainer";
const UserProfileContainer = React.lazy(() =>
  import(/* webpackChunkName: "UserProfile", webpackPreload: true */ "./UserProfileContainer"),
);

const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  useEffect(() => {
    fetchJSON<Models.User>("/api/v1/me")
      .then(setActiveUser)
      .catch(() => setActiveUser(null));
  }, []);

  const handleLogout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    setActiveUser(null);
    navigate("/");
  }, [navigate]);

  const authModalId = "auth-dialog-fixed";
  const newPostModalId = "new-post-dialog-fixed";

  return (
    <HelmetProvider>
      <AppPage
        activeUser={activeUser}
        authModalId={authModalId}
        newPostModalId={newPostModalId}
        onLogout={handleLogout}
      >
        <Suspense
          fallback={
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <TimelineItemSkeleton key={i} />
              ))}
            </div>
          }
        >
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
export default AppContainer;

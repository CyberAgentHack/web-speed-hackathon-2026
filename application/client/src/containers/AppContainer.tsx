import React, { Suspense, useCallback, useEffect, useId, useState } from "react";
import { TimelineItemSkeleton } from "../components/timeline/TimelineItemSkeleton";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
const AuthModalContainer = React.lazy(() => import("./AuthModalContainer"));
const NewPostModalContainer = React.lazy(() => import("./NewPostModalContainer"));
import { fetchJSON, sendJSON } from "../utils/fetchers";
// import TimelineContainer from "./TimelineContainer";

const CrokContainer = React.lazy(() =>
  import(/* webpackChunkName: "Crok" */ "./CrokContainer"),
);
const DirectMessageContainer = React.lazy(() =>
  import(/* webpackChunkName: "DM" */ "./DirectMessageContainer"),
);
const DirectMessageListContainer = React.lazy(() =>
  import(/* webpackChunkName: "DMList" */ "./DirectMessageListContainer"),
);
const NotFoundContainer = React.lazy(() =>
  import(/* webpackChunkName: "NotFound" */ "./NotFoundContainer"),
);
const PostContainer = React.lazy(() =>
  import(/* webpackChunkName: "Post" */ "./PostContainer"),
);
const SearchContainer = React.lazy(() =>
  import(/* webpackChunkName: "Search" */ "./SearchContainer"),
);
const TermContainer = React.lazy(() =>
  import(/* webpackChunkName: "Term" */ "./TermContainer"),
);
// Static import for LCP optimization
const TimelineContainer = React.lazy(() =>
  import(/* webpackChunkName: "Timeline" */ "./TimelineContainer"),
);
const UserProfileContainer = React.lazy(() =>
  import(/* webpackChunkName: "UserProfile" */ "./UserProfileContainer"),
);

const AppContainer = () => {
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
      .catch(() => {
        setActiveUser(null);
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

      <Suspense fallback={null}>
        <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
        <NewPostModalContainer id={newPostModalId} />
      </Suspense>
    </HelmetProvider>
  );
};
export default AppContainer;

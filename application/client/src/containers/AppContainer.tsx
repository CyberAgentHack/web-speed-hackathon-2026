import { Suspense, lazy, useCallback, useEffect, useId, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const CrokContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then((module) => ({
    default: module.CrokContainer,
  })),
);
const DirectMessageContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer").then(
    (module) => ({
      default: module.DirectMessageContainer,
    }),
  ),
);
const DirectMessageListContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer").then(
    (module) => ({
      default: module.DirectMessageListContainer,
    }),
  ),
);
const SearchContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/SearchContainer").then((module) => ({
    default: module.SearchContainer,
  })),
);
const TimelineContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/TimelineContainer").then((module) => ({
    default: module.TimelineContainer,
  })),
);
const PostContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/PostContainer").then((module) => ({
    default: module.PostContainer,
  })),
);
const NewPostModalContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer").then((module) => ({
    default: module.NewPostModalContainer,
  })),
);
const TermContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/TermContainer").then((module) => ({
    default: module.TermContainer,
  })),
);
const UserProfileContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then((module) => ({
    default: module.UserProfileContainer,
  })),
);

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  const [hasResolvedActiveUser, setHasResolvedActiveUser] = useState(false);
  useEffect(() => {
    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        setActiveUser(user);
      })
      .catch(() => {
        setActiveUser(null);
      })
      .finally(() => {
        setHasResolvedActiveUser(true);
      });
  }, [setActiveUser, setHasResolvedActiveUser]);
  const handleLogout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    setActiveUser(null);
    navigate("/");
  }, [navigate]);

  const authModalId = useId();
  const newPostModalId = useId();
  const isResolvingActiveUser = !hasResolvedActiveUser;
  const [shouldMountNewPostModal, setShouldMountNewPostModal] = useState(false);
  const [shouldOpenNewPostModal, setShouldOpenNewPostModal] = useState(false);

  useEffect(() => {
    if (activeUser === null) {
      setShouldMountNewPostModal(false);
      setShouldOpenNewPostModal(false);
    }
  }, [activeUser]);

  const handleOpenNewPostModal = useCallback(() => {
    setShouldMountNewPostModal(true);
    setShouldOpenNewPostModal(true);
  }, []);

  useEffect(() => {
    if (!shouldMountNewPostModal || !shouldOpenNewPostModal) {
      return;
    }

    let frameId = 0;

    const openModal = () => {
      const dialog = document.getElementById(newPostModalId);
      if (!(dialog instanceof HTMLDialogElement)) {
        frameId = window.requestAnimationFrame(openModal);
        return;
      }

      if (!dialog.open) {
        dialog.showModal();
      }
      setShouldOpenNewPostModal(false);
    };

    openModal();

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [newPostModalId, shouldMountNewPostModal, shouldOpenNewPostModal]);

  return (
    <HelmetProvider>
      <AppPage
        activeUser={activeUser}
        authModalId={authModalId}
        onOpenNewPostModal={handleOpenNewPostModal}
        onLogout={handleLogout}
      >
        <Suspense
          fallback={
            <>
              <Helmet>
                <title>読込中 - CaX</title>
              </Helmet>
              <div className="text-cax-text-muted flex items-center justify-center py-8">
                読込中...
              </div>
            </>
          }
        >
          <Routes>
            <Route element={<TimelineContainer />} path="/" />
            <Route
              element={
                <DirectMessageListContainer
                  activeUser={activeUser}
                  authModalId={authModalId}
                  isResolvingActiveUser={isResolvingActiveUser}
                />
              }
              path="/dm"
            />
            <Route
              element={
                <DirectMessageContainer
                  activeUser={activeUser}
                  authModalId={authModalId}
                  isResolvingActiveUser={isResolvingActiveUser}
                />
              }
              path="/dm/:conversationId"
            />
            <Route element={<SearchContainer />} path="/search" />
            <Route element={<UserProfileContainer />} path="/users/:username" />
            <Route element={<PostContainer />} path="/posts/:postId" />
            <Route element={<TermContainer />} path="/terms" />
            <Route
              element={
                <CrokContainer
                  activeUser={activeUser}
                  authModalId={authModalId}
                  isResolvingActiveUser={isResolvingActiveUser}
                />
              }
              path="/crok"
            />
            <Route element={<NotFoundContainer />} path="*" />
          </Routes>
        </Suspense>
      </AppPage>

      <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
      {activeUser !== null && shouldMountNewPostModal ? (
        <Suspense fallback={null}>
          <NewPostModalContainer id={newPostModalId} />
        </Suspense>
      ) : null}
    </HelmetProvider>
  );
};

import { Suspense, lazy, useCallback, useEffect, useId, useState } from "react";
import { HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { fetchJSON, HttpError, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const currentPathname = window.location.pathname;

const loadTimelineContainer =
  async () => import("@web-speed-hackathon-2026/client/src/containers/TimelineContainer");
const loadDirectMessageListContainer =
  async () => import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer");
const loadDirectMessageContainer =
  async () => import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer");
const loadSearchContainer =
  async () => import("@web-speed-hackathon-2026/client/src/containers/SearchContainer");
const loadUserProfileContainer =
  async () => import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer");
const loadPostContainer =
  async () => import("@web-speed-hackathon-2026/client/src/containers/PostContainer");
const loadTermContainer =
  async () => import("@web-speed-hackathon-2026/client/src/containers/TermContainer");
const loadCrokContainer =
  async () => import("@web-speed-hackathon-2026/client/src/containers/CrokContainer");
const loadNotFoundContainer =
  async () => import("@web-speed-hackathon-2026/client/src/containers/NotFoundContainer");

const timelineContainerPromise = currentPathname === "/" ? loadTimelineContainer() : null;
const directMessageListContainerPromise =
  currentPathname === "/dm" ? loadDirectMessageListContainer() : null;
const directMessageContainerPromise =
  currentPathname.startsWith("/dm/") ? loadDirectMessageContainer() : null;
const searchContainerPromise = currentPathname === "/search" ? loadSearchContainer() : null;
const userProfileContainerPromise =
  currentPathname.startsWith("/users/") ? loadUserProfileContainer() : null;
const postContainerPromise = currentPathname.startsWith("/posts/") ? loadPostContainer() : null;
const termContainerPromise = currentPathname === "/terms" ? loadTermContainer() : null;
const crokContainerPromise = currentPathname === "/crok" ? loadCrokContainer() : null;
const notFoundContainerPromise =
  timelineContainerPromise == null &&
  directMessageListContainerPromise == null &&
  directMessageContainerPromise == null &&
  searchContainerPromise == null &&
  userProfileContainerPromise == null &&
  postContainerPromise == null &&
  termContainerPromise == null &&
  crokContainerPromise == null
    ? loadNotFoundContainer()
    : null;

const AuthModalContainer = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/containers/AuthModalContainer");
  return { default: module.AuthModalContainer };
});

const NewPostModalContainer = lazy(async () => {
  const module =
    await import("@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer");
  return { default: module.NewPostModalContainer };
});

const TimelineContainer = lazy(async () => {
  const module = await (timelineContainerPromise ?? loadTimelineContainer());
  return { default: module.TimelineContainer };
});

const DirectMessageListContainer = lazy(async () => {
  const module = await (directMessageListContainerPromise ?? loadDirectMessageListContainer());
  return { default: module.DirectMessageListContainer };
});

const DirectMessageContainer = lazy(async () => {
  const module = await (directMessageContainerPromise ?? loadDirectMessageContainer());
  return { default: module.DirectMessageContainer };
});

const SearchContainer = lazy(async () => {
  const module = await (searchContainerPromise ?? loadSearchContainer());
  return { default: module.SearchContainer };
});

const UserProfileContainer = lazy(async () => {
  const module = await (userProfileContainerPromise ?? loadUserProfileContainer());
  return { default: module.UserProfileContainer };
});

const PostContainer = lazy(async () => {
  const module = await (postContainerPromise ?? loadPostContainer());
  return { default: module.PostContainer };
});

const TermContainer = lazy(async () => {
  const module = await (termContainerPromise ?? loadTermContainer());
  return { default: module.TermContainer };
});

const CrokContainer = lazy(async () => {
  const module = await (crokContainerPromise ?? loadCrokContainer());
  return { default: module.CrokContainer };
});

const NotFoundContainer = lazy(async () => {
  const module = await (notFoundContainerPromise ?? loadNotFoundContainer());
  return { default: module.NotFoundContainer };
});

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  const [isLoadingActiveUser, setIsLoadingActiveUser] = useState(true);
  useEffect(() => {
    let cancelled = false;

    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        if (!cancelled) {
          setActiveUser(user);
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        if (!(error instanceof HttpError && error.status === 401)) {
          console.error(error);
        }
        setActiveUser(null);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingActiveUser(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);
  const handleLogout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    setActiveUser(null);
    navigate("/");
  }, [navigate]);

  const authModalId = useId();
  const newPostModalId = useId();
  const [authModalOpenRequestId, setAuthModalOpenRequestId] = useState(0);
  const [newPostModalOpenRequestId, setNewPostModalOpenRequestId] = useState(0);
  const [isPostNavigationPending, setIsPostNavigationPending] = useState(false);
  const [pendingPostPath, setPendingPostPath] = useState<string | null>(null);
  const [shouldLoadAuthModal, setShouldLoadAuthModal] = useState(false);
  const [shouldLoadNewPostModal, setShouldLoadNewPostModal] = useState(false);
  const routeFallback = (
    <div className="text-cax-text-muted flex min-h-screen items-center justify-center p-6">
      読み込み中...
    </div>
  );
  const handleOpenAuthModal = useCallback(() => {
    setShouldLoadAuthModal(true);
    setAuthModalOpenRequestId((requestId) => requestId + 1);
  }, []);
  const handleOpenNewPostModal = useCallback(() => {
    setShouldLoadNewPostModal(true);
    setNewPostModalOpenRequestId((requestId) => requestId + 1);
  }, []);

  useEffect(() => {
    if (pendingPostPath !== null && pathname === pendingPostPath) {
      setIsPostNavigationPending(false);
      setPendingPostPath(null);
    }
  }, [pathname, pendingPostPath]);

  return (
    <HelmetProvider>
      <AppPage
        activeUser={activeUser}
        isLoadingActiveUser={isLoadingActiveUser}
        isPostNavigationPending={isPostNavigationPending}
        onOpenAuthModal={handleOpenAuthModal}
        onOpenNewPostModal={handleOpenNewPostModal}
        onLogout={handleLogout}
      >
        <Suspense fallback={routeFallback}>
          <Routes>
            <Route element={<TimelineContainer />} path="/" />
            <Route
              element={
                <DirectMessageListContainer
                  activeUser={activeUser}
                  isLoadingActiveUser={isLoadingActiveUser}
                  onOpenAuthModal={handleOpenAuthModal}
                />
              }
              path="/dm"
            />
            <Route
              element={
                <DirectMessageContainer
                  activeUser={activeUser}
                  isLoadingActiveUser={isLoadingActiveUser}
                  onOpenAuthModal={handleOpenAuthModal}
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
                  isLoadingActiveUser={isLoadingActiveUser}
                  onOpenAuthModal={handleOpenAuthModal}
                />
              }
              path="/crok"
            />
            <Route element={<NotFoundContainer />} path="*" />
          </Routes>
        </Suspense>
      </AppPage>

      <Suspense fallback={null}>
        {shouldLoadAuthModal ? (
          <AuthModalContainer
            id={authModalId}
            openRequestId={authModalOpenRequestId}
            onUpdateActiveUser={setActiveUser}
          />
        ) : null}
      </Suspense>
      <Suspense fallback={null}>
        {shouldLoadNewPostModal ? (
          <NewPostModalContainer
            id={newPostModalId}
            onPostNavigationFailed={() => {
              setIsPostNavigationPending(false);
              setPendingPostPath(null);
            }}
            onPostNavigationRequested={(path) => {
              setIsPostNavigationPending(true);
              setPendingPostPath(path);
            }}
            onPostRequestStarted={() => {
              setIsPostNavigationPending(true);
              setPendingPostPath(null);
            }}
            openRequestId={newPostModalOpenRequestId}
          />
        ) : null}
      </Suspense>
    </HelmetProvider>
  );
};

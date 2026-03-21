import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState } from "react";
import { Route, Routes, useLocation } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const PostContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/PostContainer").then((m) => ({
    default: m.PostContainer,
  })),
);
const UserProfileContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then((m) => ({
    default: m.UserProfileContainer,
  })),
);
const TermContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/TermContainer").then((m) => ({
    default: m.TermContainer,
  })),
);
const NotFoundContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/NotFoundContainer").then((m) => ({
    default: m.NotFoundContainer,
  })),
);
const importNewPostModalContainer = () =>
  import("@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer");
const NewPostModalContainer = lazy(() =>
  importNewPostModalContainer().then((m) => ({
    default: m.NewPostModalContainer,
  })),
);
const CrokContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then((m) => ({
    default: m.CrokContainer,
  })),
);
const DirectMessageContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer").then((m) => ({
    default: m.DirectMessageContainer,
  })),
);
const DirectMessageListContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer").then(
    (m) => ({ default: m.DirectMessageListContainer }),
  ),
);
const SearchContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/SearchContainer").then((m) => ({
    default: m.SearchContainer,
  })),
);

export const AppContainer = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  const [isNewPostModalReady, setIsNewPostModalReady] = useState(false);
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const newPostModalLoadPromiseRef = useRef<Promise<void> | null>(null);
  const activeUserRef = useRef<Models.User | null>(null);
  useEffect(() => {
    activeUserRef.current = activeUser;
  }, [activeUser]);
  useEffect(() => {
    type PrefetchCache = Record<string, Promise<unknown>>;
    const cache = (window as unknown as { __q?: PrefetchCache }).__q;
    const prefetched = cache?.["/api/v1/me"] as Promise<Models.User | null> | undefined;
    if (prefetched) {
      delete cache!["/api/v1/me"];
      void prefetched.then((user) => {
        if (user !== null) setActiveUser(user);
      });
      return;
    }
    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        setActiveUser(user);
      })
      .catch(() => {
        // Not logged in, activeUser stays null
      });
  }, []);
  const loadNewPostModal = useCallback(async () => {
    if (activeUserRef.current === null) {
      return;
    }
    if (isNewPostModalReady) {
      return;
    }
    if (newPostModalLoadPromiseRef.current === null) {
      newPostModalLoadPromiseRef.current = importNewPostModalContainer()
        .then(() => {
          if (activeUserRef.current !== null) {
            setIsNewPostModalReady(true);
          }
        })
        .finally(() => {
          newPostModalLoadPromiseRef.current = null;
        });
    }
    await newPostModalLoadPromiseRef.current;
  }, [isNewPostModalReady]);

  useEffect(() => {
    if (activeUser === null) {
      newPostModalLoadPromiseRef.current = null;
      setIsNewPostModalReady(false);
      setIsNewPostModalOpen(false);
      return;
    }
  }, [activeUser]);

  useEffect(() => {
    if (activeUser === null || pathname !== "/") {
      return;
    }

    void loadNewPostModal();
  }, [activeUser, loadNewPostModal, pathname]);
  useEffect(() => {
    if (activeUser === null || pathname !== "/") {
      return;
    }

    void import("@web-speed-hackathon-2026/client/src/utils/convert_image").then(
      ({ warmUpImageMagick }) => {
        void warmUpImageMagick();
      },
    );
    void import("@web-speed-hackathon-2026/client/src/utils/convert_movie");
    void import("@web-speed-hackathon-2026/client/src/utils/convert_sound");
    void import("@web-speed-hackathon-2026/client/src/utils/load_ffmpeg").then(
      ({ warmUpFFmpeg }) => {
        void warmUpFFmpeg();
      },
    );
  }, [activeUser, pathname]);

  const handleLogout = useCallback(async () => {
    const previousUser = activeUser;

    setIsNewPostModalOpen(false);
    setActiveUser(null);

    try {
      await sendJSON("/api/v1/signout", {});
    } catch {
      if (previousUser != null) {
        setActiveUser(previousUser);
      }
    }
  }, [activeUser]);
  const handleOpenNewPostModal = useCallback(() => {
    setIsNewPostModalOpen(true);
    void loadNewPostModal();
  }, [loadNewPostModal]);
  const handleCloseNewPostModal = useCallback(() => {
    setIsNewPostModalOpen(false);
  }, []);

  const authModalId = useId();
  const newPostModalId = useId();

  return (
    <>
      <AppPage
        activeUser={activeUser}
        authModalId={authModalId}
        canPost={activeUser !== null}
        onOpenNewPostModal={handleOpenNewPostModal}
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
              element={
                <DirectMessageContainer activeUser={activeUser} authModalId={authModalId} />
              }
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
      {activeUser !== null && isNewPostModalReady && (
        <Suspense fallback={null}>
          <NewPostModalContainer
            activeUser={activeUser}
            id={newPostModalId}
            isOpen={isNewPostModalOpen}
            onRequestClose={handleCloseNewPostModal}
          />
        </Suspense>
      )}
    </>
  );
};

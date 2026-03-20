import { lazy, Suspense, useCallback, useEffect, useId, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { RouteLoadingPage } from "@web-speed-hackathon-2026/client/src/components/application/RouteLoadingPage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { FetchError, fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const AuthModalContainer = lazy(async () => {
  const mod = await import("@web-speed-hackathon-2026/client/src/containers/AuthModalContainer");
  return { default: mod.AuthModalContainer };
});
const CrokContainer = lazy(async () => {
  const mod = await import("@web-speed-hackathon-2026/client/src/containers/CrokContainer");
  return { default: mod.CrokContainer };
});
const DirectMessageContainer = lazy(async () => {
  const mod = await import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer");
  return { default: mod.DirectMessageContainer };
});
const DirectMessageListContainer = lazy(async () => {
  const mod = await import(
    "@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer"
  );
  return { default: mod.DirectMessageListContainer };
});
const NewPostModalContainer = lazy(async () => {
  const mod = await import("@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer");
  return { default: mod.NewPostModalContainer };
});
const PostContainer = lazy(async () => {
  const mod = await import("@web-speed-hackathon-2026/client/src/containers/PostContainer");
  return { default: mod.PostContainer };
});
const SearchContainer = lazy(async () => {
  const mod = await import("@web-speed-hackathon-2026/client/src/containers/SearchContainer");
  return { default: mod.SearchContainer };
});
const TermContainer = lazy(async () => {
  const mod = await import("@web-speed-hackathon-2026/client/src/containers/TermContainer");
  return { default: mod.TermContainer };
});
const UserProfileContainer = lazy(async () => {
  const mod = await import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer");
  return { default: mod.UserProfileContainer };
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
    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        setActiveUser(user);
      })
      .catch((error: unknown) => {
        if (error instanceof FetchError && error.status === 401) {
          setActiveUser(null);
          return;
        }

        console.error(error);
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
  const [shouldRenderAuthModal, setShouldRenderAuthModal] = useState(false);
  const [shouldRenderNewPostModal, setShouldRenderNewPostModal] = useState(false);

  const handleOpenAuthModal = useCallback(() => {
    const dialog = document.getElementById(authModalId);
    if (dialog instanceof HTMLDialogElement) {
      dialog.showModal();
      return;
    }
    setShouldRenderAuthModal(true);
  }, [authModalId]);

  const handleOpenNewPostModal = useCallback(() => {
    const dialog = document.getElementById(newPostModalId);
    if (dialog instanceof HTMLDialogElement) {
      dialog.showModal();
      return;
    }
    setShouldRenderNewPostModal(true);
  }, [newPostModalId]);

  return (
    <HelmetProvider>
      {isLoadingActiveUser ? (
        <Helmet>
          <title>読込中 - CaX</title>
        </Helmet>
      ) : null}
      <AppPage
        activeUser={activeUser}
        isLoadingActiveUser={isLoadingActiveUser}
        onOpenAuthModal={handleOpenAuthModal}
        onOpenNewPostModal={handleOpenNewPostModal}
        onLogout={handleLogout}
      >
        <Routes>
          <Route element={<TimelineContainer />} path="/" />
          <Route
            element={
              <Suspense fallback={<RouteLoadingPage />}>
                <DirectMessageListContainer
                  activeUser={activeUser}
                  onOpenAuthModal={handleOpenAuthModal}
                />
              </Suspense>
            }
            path="/dm"
          />
          <Route
            element={
              <Suspense fallback={<RouteLoadingPage />}>
                <DirectMessageContainer
                  activeUser={activeUser}
                  onOpenAuthModal={handleOpenAuthModal}
                />
              </Suspense>
            }
            path="/dm/:conversationId"
          />
          <Route
            element={
              <Suspense fallback={<RouteLoadingPage />}>
                <SearchContainer />
              </Suspense>
            }
            path="/search"
          />
          <Route
            element={
              <Suspense fallback={<RouteLoadingPage />}>
                <UserProfileContainer />
              </Suspense>
            }
            path="/users/:username"
          />
          <Route
            element={
              <Suspense fallback={<RouteLoadingPage />}>
                <PostContainer />
              </Suspense>
            }
            path="/posts/:postId"
          />
          <Route
            element={
              <Suspense fallback={<RouteLoadingPage />}>
                <TermContainer />
              </Suspense>
            }
            path="/terms"
          />
          <Route
            element={
              <Suspense fallback={<RouteLoadingPage />}>
                <CrokContainer activeUser={activeUser} onOpenAuthModal={handleOpenAuthModal} />
              </Suspense>
            }
            path="/crok"
          />
          <Route element={<NotFoundContainer />} path="*" />
        </Routes>
      </AppPage>

      {shouldRenderAuthModal ? (
        <Suspense fallback={null}>
          <AuthModalContainer
            id={authModalId}
            onUpdateActiveUser={setActiveUser}
            openOnMount={true}
          />
        </Suspense>
      ) : null}
      {shouldRenderNewPostModal ? (
        <Suspense fallback={null}>
          <NewPostModalContainer id={newPostModalId} openOnMount={true} />
        </Suspense>
      ) : null}
    </HelmetProvider>
  );
};

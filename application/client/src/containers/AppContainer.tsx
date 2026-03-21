import {
  Suspense,
  lazy,
  startTransition,
  useCallback,
  useEffect,
  useId,
  useState,
} from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import {
  listenDialogOpenRequest,
  openDialog,
} from "@web-speed-hackathon-2026/client/src/utils/dialog_command";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const AuthModalContainer = lazy(() =>
  loadAuthModalContainer().then((m) => ({ default: m.AuthModalContainer })),
);
const CrokContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then((m) => ({
    default: m.CrokContainer,
  })),
);
const DirectMessageContainer = lazy(() =>
  loadDirectMessageContainer().then((m) => ({ default: m.DirectMessageContainer })),
);
const DirectMessageListContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer").then(
    (m) => ({
      default: m.DirectMessageListContainer,
    }),
  ),
);
const NotFoundContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/NotFoundContainer").then((m) => ({
    default: m.NotFoundContainer,
  })),
);
const NewPostModalContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer").then((m) => ({
    default: m.NewPostModalContainer,
  })),
);
const PostContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/PostContainer").then((m) => ({
    default: m.PostContainer,
  })),
);
const SearchContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/SearchContainer").then((m) => ({
    default: m.SearchContainer,
  })),
);
const TermContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/TermContainer").then((m) => ({
    default: m.TermContainer,
  })),
);
const UserProfileContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then((m) => ({
    default: m.UserProfileContainer,
  })),
);

const loadAuthModalContainer = () =>
  import("@web-speed-hackathon-2026/client/src/containers/AuthModalContainer");

const loadDirectMessageContainer = () =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer");

function requiresActiveUserImmediately(pathname: string): boolean {
  return pathname === "/crok" || pathname.startsWith("/dm");
}

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (pathname === "/not-found") {
      void loadAuthModalContainer();
      void loadDirectMessageContainer();
      return;
    }
    if (pathname === "/dm") {
      void loadDirectMessageContainer();
    }
  }, [pathname]);

  const needsImmediate = requiresActiveUserImmediately(pathname);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  const updateActiveUser = useCallback((user: Models.User | null) => {
    startTransition(() => {
      setActiveUser(user);
    });
  }, []);

  useEffect(() => {
    const loadUser = () => {
      void fetchJSON<Models.User>("/api/v1/me")
        .then((user) => {
          updateActiveUser(user);
        })
        .catch(() => undefined);
    };

    if (needsImmediate) {
      loadUser();
      return;
    }
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(loadUser, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(loadUser, 250);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    updateActiveUser(null);
    navigate("/");
  }, [navigate, updateActiveUser]);

  const authModalId = useId();
  const newPostModalId = useId();
  const [isAuthModalMounted] = useState(true);
  const [isNewPostModalMounted, setIsNewPostModalMounted] = useState(false);
  const [dialogOpenRequestId, setDialogOpenRequestId] = useState<string | null>(null);

  const handleDialogOpenRequest = useCallback(
    (dialogId: string) => {
      if (dialogId === newPostModalId) {
        setIsNewPostModalMounted(true);
        setDialogOpenRequestId(dialogId);
      }
    },
    [newPostModalId],
  );

  useEffect(() => {
    return listenDialogOpenRequest(handleDialogOpenRequest);
  }, [handleDialogOpenRequest]);

  useEffect(() => {
    if (dialogOpenRequestId == null) {
      return;
    }

    openDialog(dialogOpenRequestId);
    setDialogOpenRequestId(null);
  }, [dialogOpenRequestId]);

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
        {isAuthModalMounted ? (
          <AuthModalContainer id={authModalId} onUpdateActiveUser={updateActiveUser} />
        ) : null}
        {isNewPostModalMounted ? (
          <NewPostModalContainer activeUser={activeUser} id={newPostModalId} />
        ) : null}
      </Suspense>
    </>
  );
};

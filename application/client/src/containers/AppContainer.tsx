import { Suspense, useCallback, useEffect, useId, useState } from "react";
import { AppBootstrapData } from "@web-speed-hackathon-2026/client/src/bootstrap";
import { Helmet, HelmetProvider } from "@web-speed-hackathon-2026/client/src/components/foundation/Helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { DirectMessageContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer";
import { DirectMessageListContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { PostContainer } from "@web-speed-hackathon-2026/client/src/containers/PostContainer";
import { SearchContainer } from "@web-speed-hackathon-2026/client/src/containers/SearchContainer";
import { TermContainer } from "@web-speed-hackathon-2026/client/src/containers/TermContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { fetchJSON, HTTPError, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { lazyNamed } from "@web-speed-hackathon-2026/client/src/utils/lazy";

const UserProfileContainerLazy = lazyNamed(
  () =>
    import(
      /* webpackChunkName: "route-user-profile" */ "@web-speed-hackathon-2026/client/src/containers/UserProfileContainer"
    ),
  "UserProfileContainer",
);
const CrokContainerLazy = lazyNamed(
  () =>
    import(
      /* webpackChunkName: "route-crok" */ "@web-speed-hackathon-2026/client/src/containers/CrokContainer"
    ),
  "CrokContainer",
);
const NotFoundContainerLazy = lazyNamed(
  () =>
    import(
      /* webpackChunkName: "route-not-found" */ "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer"
    ),
  "NotFoundContainer",
);

function requiresResolvedActiveUser(pathname: string) {
  return pathname === "/crok" || pathname.startsWith("/dm");
}

function scheduleDeferredTask(task: () => void) {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    const callbackId = window.requestIdleCallback(task, { timeout: 1500 });
    return () => {
      window.cancelIdleCallback(callbackId);
    };
  }

  const timeoutId = globalThis.setTimeout(task, 250);
  return () => {
    globalThis.clearTimeout(timeoutId);
  };
}

interface Props {
  bootstrap?: AppBootstrapData | null;
}

export const AppContainer = ({ bootstrap = null }: Props) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const shouldResolveActiveUserImmediately = requiresResolvedActiveUser(pathname);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  const [hasResolvedActiveUser, setHasResolvedActiveUser] = useState(false);
  useEffect(() => {
    let isDisposed = false;
    const loadActiveUser = () => {
      void fetchJSON<Models.User>("/api/v1/me")
        .then((user) => {
          if (!isDisposed) {
            setActiveUser(user);
          }
        })
        .catch((error: unknown) => {
          if (isDisposed) {
            return;
          }
          if (error instanceof HTTPError && error.status === 401) {
            setActiveUser(null);
            return;
          }
          console.error(error);
        })
        .finally(() => {
          if (!isDisposed) {
            setHasResolvedActiveUser(true);
          }
        });
    };

    if (shouldResolveActiveUserImmediately) {
      loadActiveUser();
    } else {
      const cancel = scheduleDeferredTask(loadActiveUser);
      return () => {
        isDisposed = true;
        cancel();
      };
    }

    return () => {
      isDisposed = true;
    };
  }, [shouldResolveActiveUserImmediately]);
  const handleLogout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    setActiveUser(null);
    navigate("/");
  }, [navigate]);

  const authModalId = useId();
  const newPostModalId = useId();

  if (!hasResolvedActiveUser && shouldResolveActiveUserImmediately) {
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
        <Routes>
          <Route
            element={<TimelineContainer initialPosts={bootstrap?.initialTimelinePosts} />}
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
                <UserProfileContainerLazy />
              </Suspense>
            }
            path="/users/:username"
          />
          <Route element={<PostContainer />} path="/posts/:postId" />
          <Route element={<TermContainer />} path="/terms" />
          <Route
            element={
              <Suspense fallback={null}>
                <CrokContainerLazy activeUser={activeUser} authModalId={authModalId} />
              </Suspense>
            }
            path="/crok"
          />
          <Route
            element={
              <Suspense fallback={null}>
                <NotFoundContainerLazy />
              </Suspense>
            }
            path="*"
          />
        </Routes>
      </AppPage>

      <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
      <NewPostModalContainer id={newPostModalId} />
    </HelmetProvider>
  );
};

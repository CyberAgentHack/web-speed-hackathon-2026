import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const AuthModalContainer = lazy(async () =>
  import("@web-speed-hackathon-2026/client/src/containers/AuthModalContainer").then((module) => ({
    default: module.AuthModalContainer,
  })),
);
const CrokContainer = lazy(async () =>
  import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then((module) => ({
    default: module.CrokContainer,
  })),
);
const DirectMessageContainer = lazy(async () =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer").then(
    (module) => ({
      default: module.DirectMessageContainer,
    }),
  ),
);
const DirectMessageListContainer = lazy(async () =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer").then(
    (module) => ({
      default: module.DirectMessageListContainer,
    }),
  ),
);
const NewPostModalContainer = lazy(async () =>
  import("@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer").then(
    (module) => ({
      default: module.NewPostModalContainer,
    }),
  ),
);
const NotFoundContainer = lazy(async () =>
  import("@web-speed-hackathon-2026/client/src/containers/NotFoundContainer").then((module) => ({
    default: module.NotFoundContainer,
  })),
);
const PostContainer = lazy(async () =>
  import("@web-speed-hackathon-2026/client/src/containers/PostContainer").then((module) => ({
    default: module.PostContainer,
  })),
);
const SearchContainer = lazy(async () =>
  import("@web-speed-hackathon-2026/client/src/containers/SearchContainer").then((module) => ({
    default: module.SearchContainer,
  })),
);
const TermContainer = lazy(async () =>
  import("@web-speed-hackathon-2026/client/src/containers/TermContainer").then((module) => ({
    default: module.TermContainer,
  })),
);
const UserProfileContainer = lazy(async () =>
  import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then(
    (module) => ({
      default: module.UserProfileContainer,
    }),
  ),
);

const RouteLoadingFallback = () => {
  return (
    <section className="min-h-[60vh] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-cax-border bg-cax-surface-subtle/80 px-6 py-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full border border-cax-border bg-cax-surface px-3 py-1 text-xs tracking-[0.2em] text-cax-text-muted uppercase">
          CaX
        </p>
        <h1 className="text-cax-text text-4xl leading-tight font-bold text-balance sm:text-5xl">
          画面を準備しています
        </h1>
        <p className="text-cax-text-muted mt-4 max-w-2xl text-base leading-8 sm:text-lg">
          タイムライン、検索、投稿詳細、DM をすばやく表示できるように、必要な画面データを読み込んでいます。
        </p>
      </div>
    </section>
  );
};

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  const authStateVersionRef = useRef(0);

  const handleUpdateActiveUser = useCallback((user: Models.User) => {
    authStateVersionRef.current += 1;
    flushSync(() => {
      setActiveUser(user);
    });
  }, []);

  useEffect(() => {
    const requestVersion = authStateVersionRef.current;

    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        if (requestVersion !== authStateVersionRef.current) {
          return;
        }
        flushSync(() => {
          setActiveUser(user);
        });
      })
      .catch((error: { status?: number }) => {
        if (requestVersion !== authStateVersionRef.current) {
          return;
        }
        flushSync(() => {
          setActiveUser(null);
        });
        if (error.status !== 401) {
          console.error(error);
        }
      })
      .finally(() => {
        if (requestVersion !== authStateVersionRef.current) {
          return;
        }
      });
  }, [setActiveUser]);
  const handleLogout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    authStateVersionRef.current += 1;
    flushSync(() => {
      setActiveUser(null);
    });
    navigate("/");
  }, [navigate]);

  const authModalId = useId();
  const newPostModalId = useId();

  return (
    <HelmetProvider>
      <AppPage
        activeUser={activeUser}
        authModalId={authModalId}
        newPostModalId={newPostModalId}
        onLogout={handleLogout}
      >
        <Suspense fallback={<RouteLoadingFallback />}>
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
        <AuthModalContainer id={authModalId} onUpdateActiveUser={handleUpdateActiveUser} />
        <NewPostModalContainer id={newPostModalId} />
      </Suspense>
    </HelmetProvider>
  );
};

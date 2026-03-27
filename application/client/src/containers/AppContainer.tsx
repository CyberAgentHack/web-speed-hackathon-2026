import { lazy, Suspense, useCallback, useEffect, useId, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { PostContainer } from "@web-speed-hackathon-2026/client/src/containers/PostContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const CrokContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then((m) => ({
    default: m.CrokContainer,
  })),
);
const NotFoundContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/NotFoundContainer").then((m) => ({
    default: m.NotFoundContainer,
  })),
);
const UserProfileContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then((m) => ({
    default: m.UserProfileContainer,
  })),
);

const DirectMessageContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer").then((m) => ({
    default: m.DirectMessageContainer,
  })),
);

const DirectMessageListContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer").then((m) => ({
    default: m.DirectMessageListContainer,
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

// ルート初期表示でだけ lazy chunk の取得を前倒しする
if (typeof window !== "undefined") {
  const path = window.location.pathname;

  if (path === "/search") {
    void import("@web-speed-hackathon-2026/client/src/containers/SearchContainer");
  } else if (path === "/terms") {
    void import("@web-speed-hackathon-2026/client/src/containers/TermContainer");
  } else if (path === "/dm") {
    void import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer");
  } else if (path.startsWith("/dm/")) {
    void import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer");
  }
}

const routeSuspenseFallback = (
  <p
    className="bg-cax-canvas text-cax-text p-8 text-4xl font-bold leading-tight min-h-[160px]"
    role="status"
  >
    読込中...
  </p>
);

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // サーバーからプリロードされた /api/v1/me データがあれば初期状態に反映する
  const _preloadedMe = (() => {
    const p = typeof window !== "undefined"
      ? (window as unknown as Record<string, unknown>).__PRELOAD_DATA__
      : null;
    return p && typeof p === "object" && "/api/v1/me" in (p as Record<string, unknown>)
      ? { found: true, value: (p as Record<string, unknown>)["/api/v1/me"] as Models.User | null }
      : { found: false, value: null };
  })();

  const [activeUser, setActiveUser] = useState<Models.User | null>(_preloadedMe.found ? _preloadedMe.value : null);
  const [isLoadingActiveUser, setIsLoadingActiveUser] = useState(!_preloadedMe.found);

  useEffect(() => {
    if (_preloadedMe.found) return; // プリロード済みならスキップ
    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        setActiveUser(user);
      })
      .finally(() => {
        setIsLoadingActiveUser(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleLogout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    setActiveUser(null);
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
        <Suspense fallback={routeSuspenseFallback}>
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
      <NewPostModalContainer id={newPostModalId} />
    </HelmetProvider>
  );
};

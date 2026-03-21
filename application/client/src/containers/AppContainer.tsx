import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const TimelineContainer = lazy(
  () => import("@web-speed-hackathon-2026/client/src/containers/TimelineContainer"),
);
const TermContainer = lazy(
  () => import("@web-speed-hackathon-2026/client/src/containers/TermContainer"),
);
const DirectMessageListContainer = lazy(
  () => import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer"),
);
const DirectMessageContainer = lazy(
  () => import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer"),
);
const SearchContainer = lazy(
  () => import("@web-speed-hackathon-2026/client/src/containers/SearchContainer"),
);
const UserProfileContainer = lazy(
  () => import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer"),
);
const PostContainer = lazy(
  () => import("@web-speed-hackathon-2026/client/src/containers/PostContainer"),
);
const CrokContainer = lazy(
  () => import("@web-speed-hackathon-2026/client/src/containers/CrokContainer"),
);
const NotFoundContainer = lazy(
  () => import("@web-speed-hackathon-2026/client/src/containers/NotFoundContainer"),
);

function DeferredModal({
  id,
  factory,
  componentProps,
}: {
  id: string;
  factory: () => Promise<{ default: React.ComponentType<any> }>;
  componentProps: Record<string, unknown>;
}) {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const needsReopen = useRef(false);
  const placeholderRef = useRef<HTMLDialogElement>(null);
  const factoryRef = useRef(factory);

  useEffect(() => {
    const idleId = requestIdleCallback(() => {
      factoryRef.current().then((mod) => setComponent(() => mod.default));
    });
    return () => cancelIdleCallback(idleId);
  }, []);

  useEffect(() => {
    const el = placeholderRef.current;
    if (!el || Component) return;
    const onToggle = (e: Event) => {
      if ((e as ToggleEvent).newState === "open") {
        needsReopen.current = true;
        el.close();
        factoryRef.current().then((mod) => setComponent(() => mod.default));
      }
    };
    el.addEventListener("toggle", onToggle);
    return () => el.removeEventListener("toggle", onToggle);
  }, [Component]);

  useEffect(() => {
    if (Component && needsReopen.current) {
      needsReopen.current = false;
      requestAnimationFrame(() => {
        const dialog = document.getElementById(id) as HTMLDialogElement | null;
        if (dialog && !dialog.open) {
          dialog.showModal();
        }
      });
    }
  }, [Component, id]);

  if (!Component) {
    return (
      <dialog
        id={id}
        ref={placeholderRef}
        closedby={"any" as never}
        className="backdrop:bg-cax-overlay/50 bg-cax-surface fixed inset-0 m-auto w-full max-w-[calc(min(var(--container-md),100%)-var(--spacing)*4)] rounded-lg p-4"
      />
    );
  }

  return <Component {...componentProps} id={id} />;
}

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  const [_isLoadingActiveUser, setIsLoadingActiveUser] = useState(true);
  useEffect(() => {
    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        setActiveUser(user);
      })
      .catch(() => {
        // 未ログイン時は401が返る
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

  return (
    <>
      <AppPage
        activeUser={activeUser}
        authModalId={authModalId}
        newPostModalId={newPostModalId}
        onLogout={handleLogout}
      >
        <Suspense fallback={<div className="min-h-screen" />}>
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

      <DeferredModal
        id={authModalId}
        factory={() =>
          import("@web-speed-hackathon-2026/client/src/containers/AuthModalContainer").then(
            (m) => ({
              default: m.AuthModalContainer,
            }),
          )
        }
        componentProps={{ onUpdateActiveUser: setActiveUser }}
      />
      <DeferredModal
        id={newPostModalId}
        factory={() =>
          import("@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer")
        }
        componentProps={{}}
      />
    </>
  );
};

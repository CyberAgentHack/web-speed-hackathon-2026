import {
  Component,
  lazy,
  ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useState,
} from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

class LazyErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  override state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  override render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

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
    (m) => ({
      default: m.DirectMessageListContainer,
    }),
  ),
);
const SearchContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/SearchContainer").then((m) => ({
    default: m.SearchContainer,
  })),
);
const UserProfileContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then((m) => ({
    default: m.UserProfileContainer,
  })),
);
const PostContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/PostContainer").then((m) => ({
    default: m.PostContainer,
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

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // PostContainer チャンクをアイドル時に先読みし、遷移時のタイムアウトを防ぐ
  useEffect(() => {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        import("@web-speed-hackathon-2026/client/src/containers/PostContainer");
      });
    }
  }, []);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  useEffect(() => {
    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        setActiveUser(user);
      })
      .catch(() => {
        // 未認証の場合は何もしない (activeUser = null のまま)
      });
  }, []);
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
        <LazyErrorBoundary>
          <Suspense fallback={<div />}>
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
        </LazyErrorBoundary>
      </AppPage>

      <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
      <NewPostModalContainer id={newPostModalId} />
    </>
  );
};

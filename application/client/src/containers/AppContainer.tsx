import { lazy, Suspense, useCallback, useEffect, useId, useState } from "react";

import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
/**
 * AuthModalContainer / NewPostModalContainer は lazy() から外して直接importする。
 * サインインフロー（4フロー最大200点に影響）と投稿フローの安定性を確保するため、
 * モーダルのチャンクロード待ちによるタイムアウトを排除する。
 */
/**
 * AuthModalContainer / NewPostModalContainer のみ lazy() から外して直接importする。
 * サインインフロー（4フロー最大200点に影響）と投稿フローの安定性を確保するため。
 * 他のコンテナはfly.ioのshared CPUではメインバンドル肥大化でTBT悪化するためlazy維持。
 */
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

/**
 * 各ルートコンテナをReact.lazyで遅延ロードする。
 * fly.ioのshared CPU 1コアではメインバンドル肥大化がTBTを悪化させるため、
 * AuthModal/NewPostModal以外は全てlazyにする。
 */
const TimelineContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/TimelineContainer").then((m) => ({ default: m.TimelineContainer })),
);
const DirectMessageListContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer").then((m) => ({ default: m.DirectMessageListContainer })),
);
const DirectMessageContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer").then((m) => ({ default: m.DirectMessageContainer })),
);
const SearchContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/SearchContainer").then((m) => ({ default: m.SearchContainer })),
);
const UserProfileContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then((m) => ({ default: m.UserProfileContainer })),
);
const PostContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/PostContainer").then((m) => ({ default: m.PostContainer })),
);
const TermContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/TermContainer").then((m) => ({ default: m.TermContainer })),
);
const CrokContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then((m) => ({ default: m.CrokContainer })),
);
const NotFoundContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/NotFoundContainer").then((m) => ({ default: m.NotFoundContainer })),
);
export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  useEffect(() => {
    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        setActiveUser(user);
      })
      .catch(() => {
        // 未ログイン時は404が返るため無視
      });
  }, [setActiveUser]);
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
        <Suspense>
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

      <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
      <NewPostModalContainer id={newPostModalId} />
    </>
  );
};

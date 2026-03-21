import { lazy, Suspense, useCallback, useEffect, useId, useState } from "react";
import { HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
/**
 * AuthModalContainer / NewPostModalContainer は lazy() から外して直接importする。
 * サインインフロー（4フロー最大200点に影響）と投稿フローの安定性を確保するため、
 * モーダルのチャンクロード待ちによるタイムアウトを排除する。
 */
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
/**
 * DM関連コンテナもlazy()から外す。
 * fly.ioのCPU制約でチャンクロード+パースがTBTを悪化させるため。
 */
import { DirectMessageContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer";
import { DirectMessageListContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
/**
 * TimelineContainerもlazy()から外す。
 * ホームは最頻アクセスページで、チャンクロード排除によりTBT/LCP改善を狙う。
 */
/**
 * 重い依存を持たないコンテナはlazy()から外して初期バンドルに含める。
 * fly.ioのCPU制約でチャンクロード+パースがTBTを悪化させるため。
 */
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { TermContainer } from "@web-speed-hackathon-2026/client/src/containers/TermContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { UserProfileContainer } from "@web-speed-hackathon-2026/client/src/containers/UserProfileContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

/**
 * 重い依存（kuromoji, katex, react-markdown等）を持つページのみlazy。
 */
const SearchContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/SearchContainer").then((m) => ({ default: m.SearchContainer })),
);
const PostContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/PostContainer").then((m) => ({ default: m.PostContainer })),
);
const CrokContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then((m) => ({ default: m.CrokContainer })),
);
export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  useEffect(() => {
    // index.htmlのインラインスクリプトで先行開始したfetchの結果を再利用する。
    // JSバンドルのパース時間分だけAPI待ちが短縮される。
    const prefetch = (window as unknown as { __prefetch?: { me?: Promise<Models.User | null> } }).__prefetch;
    const mePromise = prefetch?.me ?? fetchJSON<Models.User>("/api/v1/me").catch(() => null);
    void mePromise.then((user) => {
      if (user) setActiveUser(user);
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
    <HelmetProvider>
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
    </HelmetProvider>
  );
};

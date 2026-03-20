import { useCallback, useEffect, useId, useState, lazy, Suspense } from "react";
// Helmet を追加でインポート
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

// コンテナ類（変更なし）
const TimelineContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/TimelineContainer").then(m => ({ default: m.TimelineContainer })));
const DirectMessageListContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer").then(m => ({ default: m.DirectMessageListContainer })));
const DirectMessageContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer").then(m => ({ default: m.DirectMessageContainer })));
const SearchContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/SearchContainer").then(m => ({ default: m.SearchContainer })));
const UserProfileContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then(m => ({ default: m.UserProfileContainer })));
const PostContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/PostContainer").then(m => ({ default: m.PostContainer })));
const TermContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/TermContainer").then(m => ({ default: m.TermContainer })));
const CrokContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then(m => ({ default: m.CrokContainer })));
const NotFoundContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/NotFoundContainer").then(m => ({ default: m.NotFoundContainer })));
const NewPostModalContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer").then(m => ({ default: m.NewPostModalContainer })));

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  const [isLoadingActiveUser, setIsLoadingActiveUser] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => { setActiveUser(user); })
      .catch(() => { setActiveUser(null); })
      .finally(() => { setIsLoadingActiveUser(false); });
  }, []);

  const handleLogout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    setActiveUser(null);
    navigate("/");
  }, [navigate]);

  const authModalId = useId();
  const newPostModalId = useId();

  // if (isLoadingActiveUser) {
  //   return <div style={{ padding: "20px" }}>読み込み中...</div>;
  // }

  return (
    <HelmetProvider>
      {/* 🚀 SEO と Accessibility のための設定を追加 */}
      <Helmet>
        <html lang="ja" />
        <title>CaX - 爆速なSNS体験を</title>
        <meta name="description" content="CaXは、Web Speed Hackathon 2026のために最適化された、次世代のSNSプラットフォームです。" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>

      <AppPage
        activeUser={activeUser}
        authModalId={authModalId}
        newPostModalId={newPostModalId}
        onLogout={handleLogout}
      >
        <Suspense fallback={<div style={{ padding: "20px" }}>コンテンツ読み込み中...</div>}>
          <Routes>
            <Route element={<TimelineContainer />} path="/" />
            <Route element={<DirectMessageListContainer activeUser={activeUser} authModalId={authModalId} isLoadingActiveUser={isLoadingActiveUser} />} path="/dm" />
            <Route element={<DirectMessageContainer activeUser={activeUser} authModalId={authModalId} isLoadingActiveUser={isLoadingActiveUser} />} path="/dm/:conversationId" />
            <Route element={<SearchContainer />} path="/search" />
            <Route element={<UserProfileContainer />} path="/users/:username" />
            <Route element={<PostContainer />} path="/posts/:postId" />
            <Route element={<TermContainer />} path="/terms" />
            <Route element={<CrokContainer activeUser={activeUser} authModalId={authModalId} />} path="/crok" />
            <Route element={<NotFoundContainer />} path="*" />
          </Routes>
        </Suspense>
      </AppPage>

      <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
      
      {activeUser && (
        <Suspense fallback={null}>
          <NewPostModalContainer id={newPostModalId} />
        </Suspense>
      )}
    </HelmetProvider>
  );
};
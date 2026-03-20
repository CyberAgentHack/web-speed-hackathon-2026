import { useCallback, useEffect, useId, useState, lazy, Suspense } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

// 犯人候補1: AppPage (これを一旦外す)
// import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

// コンテナ類はそのまま
const TimelineContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/TimelineContainer").then(m => ({ default: m.TimelineContainer })));
const DirectMessageListContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer").then(m => ({ default: m.DirectMessageListContainer })));
const DirectMessageContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer").then(m => ({ default: m.DirectMessageContainer })));
const SearchContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/SearchContainer").then(m => ({ default: m.SearchContainer })));
const UserProfileContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then(m => ({ default: m.UserProfileContainer })));
const PostContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/PostContainer").then(m => ({ default: m.PostContainer })));
const TermContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/TermContainer").then(m => ({ default: m.TermContainer })));
const CrokContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then(m => ({ default: m.CrokContainer })));
const NotFoundContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/NotFoundContainer").then(m => ({ default: m.NotFoundContainer })));

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

  if (isLoadingActiveUser) {
    return <div style={{ padding: "20px" }}>読み込み中...</div>;
  }

  return (
    <HelmetProvider>
      {/* 
         【バイパス実施】 
         AppPage を消して、素の div で Routes を囲みます。
         これで 4点 のままなら、犯人は TimelineContainer です。
      */}
      <div style={{ border: "10px solid red", minHeight: "100vh", padding: "20px" }}>
        <h1 style={{ color: "red" }}>⚠️ AppPage バイパス中 (デバッグモード)</h1>
        
        <Suspense fallback={<div style={{ padding: "20px" }}>コンテンツ読込中...</div>}>
          <Routes>
            <Route element={<TimelineContainer />} path="/" />
            <Route element={<DirectMessageListContainer activeUser={activeUser} authModalId={authModalId} />} path="/dm" />
            <Route element={<DirectMessageContainer activeUser={activeUser} authModalId={authModalId} />} path="/dm/:conversationId" />
            <Route element={<SearchContainer />} path="/search" />
            <Route element={<UserProfileContainer />} path="/users/:username" />
            <Route element={<PostContainer />} path="/posts/:postId" />
            <Route element={<TermContainer />} path="/terms" />
            <Route element={<CrokContainer activeUser={activeUser} authModalId={authModalId} />} path="/crok" />
            <Route element={<NotFoundContainer />} path="*" />
          </Routes>
        </Suspense>
      </div>

      <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
    </HelmetProvider>
  );
};
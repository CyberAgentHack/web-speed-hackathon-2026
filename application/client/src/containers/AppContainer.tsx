import { lazy, Suspense, useCallback, useEffect, useId } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { QueryClientProvider } from "@tanstack/react-query";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { ActiveUserProvider, useActiveUser } from "@web-speed-hackathon-2026/client/src/contexts/ActiveUserContext";
import { queryClient } from "@web-speed-hackathon-2026/client/src/query_client";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const TimelineContainer = lazy(() =>
  import("./TimelineContainer").then((m) => ({
    default: m.TimelineContainer,
  })),
);
const DirectMessageListContainer = lazy(() =>
  import("./DirectMessageListContainer").then((m) => ({
    default: m.DirectMessageListContainer,
  })),
);
const DirectMessageContainer = lazy(() =>
  import("./DirectMessageContainer").then((m) => ({
    default: m.DirectMessageContainer,
  })),
);
const SearchContainer = lazy(() =>
  import("./SearchContainer").then((m) => ({
    default: m.SearchContainer,
  })),
);
const UserProfileContainer = lazy(() =>
  import("./UserProfileContainer").then((m) => ({
    default: m.UserProfileContainer,
  })),
);
const PostContainer = lazy(() =>
  import("./PostContainer").then((m) => ({
    default: m.PostContainer,
  })),
);
const TermContainer = lazy(() =>
  import("./TermContainer").then((m) => ({
    default: m.TermContainer,
  })),
);
const CrokContainer = lazy(() =>
  import("./CrokContainer").then((m) => ({
    default: m.CrokContainer,
  })),
);
const NotFoundContainer = lazy(() =>
  import("./NotFoundContainer").then((m) => ({
    default: m.NotFoundContainer,
  })),
);

const RouteFallback = () => (
  <>
    <Helmet>
      <title>読込中 - CaX</title>
    </Helmet>
    <div className="text-cax-text p-4">読込中…</div>
  </>
);

const AppRoutes = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isLoading, setActiveUser } = useActiveUser();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    setActiveUser(null);
    navigate("/");
  }, [navigate, setActiveUser]);

  const authModalId = useId();
  const newPostModalId = useId();

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>読込中 - CaX</title>
        </Helmet>
      </>
    );
  }

  return (
    <>
      <AppPage authModalId={authModalId} newPostModalId={newPostModalId} onLogout={handleLogout}>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<TimelineContainer />} path="/" />
            <Route
              element={<DirectMessageListContainer authModalId={authModalId} />}
              path="/dm"
            />
            <Route
              element={<DirectMessageContainer authModalId={authModalId} />}
              path="/dm/:conversationId"
            />
            <Route element={<SearchContainer />} path="/search" />
            <Route element={<UserProfileContainer />} path="/users/:username" />
            <Route element={<PostContainer />} path="/posts/:postId" />
            <Route element={<TermContainer />} path="/terms" />
            <Route element={<CrokContainer authModalId={authModalId} />} path="/crok" />
            <Route element={<NotFoundContainer />} path="*" />
          </Routes>
        </Suspense>
      </AppPage>

      <AuthModalContainer id={authModalId} />
      <NewPostModalContainer id={newPostModalId} />
    </>
  );
};

export const AppContainer = () => {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ActiveUserProvider>
          <AppRoutes />
        </ActiveUserProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

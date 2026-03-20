import { lazy, ReactNode, Suspense, useCallback, useEffect, useId, useState } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { SSRDataContext } from "@web-speed-hackathon-2026/client/src/contexts/SSRDataContext";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const AuthModalContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/AuthModalContainer").then((m) => ({
    default: m.AuthModalContainer,
  })),
);
const NewPostModalContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer").then((m) => ({
    default: m.NewPostModalContainer,
  })),
);

import "../buildinfo";

declare global {
  interface Window {
    __SSR_DATA__?: {
      routeData: Record<string, unknown>;
      activeUser: Models.User | null;
    };
  }
}

export function createPage(renderContent: (props: { activeUser: Models.User | null; authModalId: string }) => ReactNode) {
  const ssrData = window.__SSR_DATA__;
  const container = document.getElementById("app")!;

  const App = () => {
    const authModalId = useId();
    const hasSSRData = ssrData?.activeUser !== undefined;
    const [activeUser, setActiveUser] = useState<Models.User | null>(hasSSRData ? (ssrData?.activeUser ?? null) : null);
    const [isLoadingActiveUser, setIsLoadingActiveUser] = useState(!hasSSRData);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
      setIsMounted(true);
    }, []);

    useEffect(() => {
      if (hasSSRData) return;
      void fetchJSON<Models.User>("/api/v1/me")
        .then((user) => {
          setActiveUser(user);
        })
        .finally(() => {
          setIsLoadingActiveUser(false);
        });
    }, [hasSSRData]);

    const handleLogout = useCallback(async () => {
      await sendJSON("/api/v1/signout", {});
      setActiveUser(null);
      if (window.location.pathname.startsWith("/dm")) {
        window.location.href = "/";
      }
    }, []);

    const newPostModalId = useId();

    if (isLoadingActiveUser) {
      document.title = "読込中 - CaX";
      return null;
    }

    return (
      <SSRDataContext.Provider value={ssrData?.routeData ?? null}>
        <AppPage
          activeUser={activeUser}
          authModalId={authModalId}
          newPostModalId={newPostModalId}
          onLogout={handleLogout}
        >
          {renderContent({ activeUser, authModalId })}
        </AppPage>

        {isMounted && (
          <Suspense fallback={null}>
            <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
            <NewPostModalContainer id={newPostModalId} />
          </Suspense>
        )}
      </SSRDataContext.Provider>
    );
  };

  const app = <App />;

  if (ssrData && container.hasChildNodes()) {
    hydrateRoot(container, app);
  } else {
    createRoot(container).render(app);
  }
}

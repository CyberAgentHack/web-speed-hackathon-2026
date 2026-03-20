import { ReactNode, useCallback, useEffect, useId, useState } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { Helmet, HelmetProvider } from "react-helmet";
import { Provider } from "react-redux";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { SSRDataContext } from "@web-speed-hackathon-2026/client/src/contexts/SSRDataContext";
import { store } from "@web-speed-hackathon-2026/client/src/store";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

import "../index.css";
import "../buildinfo";

declare global {
  interface Window {
    __SSR_DATA__?: {
      routeData: Record<string, unknown>;
      activeUser: Models.User | null;
    };
  }
}

interface PageWrapperProps {
  ssrActiveUser?: Models.User | null;
  children: ReactNode;
}

const PageWrapper = ({ ssrActiveUser, children }: PageWrapperProps) => {
  const hasSSRData = ssrActiveUser !== undefined;
  const [activeUser, setActiveUser] = useState<Models.User | null>(hasSSRData ? ssrActiveUser! : null);
  const [isLoadingActiveUser, setIsLoadingActiveUser] = useState(!hasSSRData);

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
    window.location.href = "/";
  }, []);

  const authModalId = useId();
  const newPostModalId = useId();

  if (isLoadingActiveUser) {
    return (
      <HelmetProvider>
        <Helmet>
          <title>読込中 - CaX</title>
        </Helmet>
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <AppPage
        activeUser={activeUser}
        authModalId={authModalId}
        newPostModalId={newPostModalId}
        onLogout={handleLogout}
      >
        {children}
      </AppPage>

      <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
      <NewPostModalContainer id={newPostModalId} />
    </HelmetProvider>
  );
};

export function createPage(renderContent: (props: { activeUser: Models.User | null; authModalId: string }) => ReactNode) {
  const ssrData = window.__SSR_DATA__;
  const container = document.getElementById("app")!;

  const App = () => {
    const authModalId = useId();
    const hasSSRData = ssrData?.activeUser !== undefined;
    const [activeUser, setActiveUser] = useState<Models.User | null>(hasSSRData ? (ssrData?.activeUser ?? null) : null);
    const [isLoadingActiveUser, setIsLoadingActiveUser] = useState(!hasSSRData);

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
      window.location.href = "/";
    }, []);

    const newPostModalId = useId();

    if (isLoadingActiveUser) {
      return (
        <HelmetProvider>
          <Helmet>
            <title>読込中 - CaX</title>
          </Helmet>
        </HelmetProvider>
      );
    }

    return (
      <Provider store={store}>
        <SSRDataContext.Provider value={ssrData?.routeData ?? null}>
          <HelmetProvider>
            <AppPage
              activeUser={activeUser}
              authModalId={authModalId}
              newPostModalId={newPostModalId}
              onLogout={handleLogout}
            >
              {renderContent({ activeUser, authModalId })}
            </AppPage>

            <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
            <NewPostModalContainer id={newPostModalId} />
          </HelmetProvider>
        </SSRDataContext.Provider>
      </Provider>
    );
  };

  const app = <App />;

  if (ssrData && container.hasChildNodes()) {
    hydrateRoot(container, app);
  } else {
    createRoot(container).render(app);
  }
}

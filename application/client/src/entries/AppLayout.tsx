import { type ReactNode, useId } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";
import { createRoot } from "react-dom/client";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { useActiveUser } from "@web-speed-hackathon-2026/client/src/hooks/use-active-user";
import { store } from "@web-speed-hackathon-2026/client/src/store";

interface Props {
  children: (props: { activeUser: Models.User | null; authModalId: string }) => ReactNode;
}

function AppLayout({ children }: Props) {
  const { activeUser, isLoadingActiveUser, onLogout, onUpdateActiveUser } = useActiveUser();
  const authModalId = useId();
  const newPostModalId = useId();

  return (
    <HelmetProvider>
      {isLoadingActiveUser ? (
        <Helmet>
          <title>読込中 - CaX</title>
        </Helmet>
      ) : (
        <>
          <AppPage
            activeUser={activeUser}
            authModalId={authModalId}
            newPostModalId={newPostModalId}
            onLogout={onLogout}
          >
            {children({ activeUser, authModalId })}
          </AppPage>
          <AuthModalContainer id={authModalId} onUpdateActiveUser={onUpdateActiveUser} />
          <NewPostModalContainer id={newPostModalId} />
        </>
      )}
    </HelmetProvider>
  );
}

export function mountPage(
  children: (props: { activeUser: Models.User | null; authModalId: string }) => ReactNode,
) {
  window.addEventListener("load", () => {
    createRoot(document.getElementById("app")!).render(
      <Provider store={store}>
        <BrowserRouter>
          <AppLayout>{children}</AppLayout>
        </BrowserRouter>
      </Provider>,
    );
  });
}

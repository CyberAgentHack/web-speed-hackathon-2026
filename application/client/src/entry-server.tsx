import { ReactNode, useCallback, useId } from "react";
import { renderToString } from "react-dom/server";
import { Provider } from "react-redux";
import { combineReducers, legacy_createStore as createStore } from "redux";
import { reducer as formReducer } from "redux-form";
import { Helmet, HelmetProvider } from "react-helmet";

import { SSRDataContext } from "@web-speed-hackathon-2026/client/src/contexts/SSRDataContext";
import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { DirectMessageListContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer";
import { DirectMessageContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer";
import { SearchContainer } from "@web-speed-hackathon-2026/client/src/containers/SearchContainer";
import { UserProfileContainer } from "@web-speed-hackathon-2026/client/src/containers/UserProfileContainer";
import { PostContainer } from "@web-speed-hackathon-2026/client/src/containers/PostContainer";
import { TermContainer } from "@web-speed-hackathon-2026/client/src/containers/TermContainer";
import { CrokContainer } from "@web-speed-hackathon-2026/client/src/containers/CrokContainer";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";

interface SSRPayload {
  routeData: Record<string, unknown>;
  activeUser: Models.User | null;
}

type PageName = "timeline" | "dm-list" | "dm" | "search" | "user-profile" | "post" | "terms" | "crok" | "not-found";

interface PageProps {
  activeUser: Models.User | null;
  authModalId: string;
  [key: string]: unknown;
}

const PAGE_MAP: Record<PageName, (props: PageProps) => ReactNode> = {
  timeline: () => <TimelineContainer />,
  "dm-list": ({ activeUser, authModalId }) => (
    <DirectMessageListContainer activeUser={activeUser} authModalId={authModalId} />
  ),
  dm: ({ activeUser, authModalId, conversationId }) => (
    <DirectMessageContainer activeUser={activeUser} authModalId={authModalId} conversationId={conversationId as string} />
  ),
  search: () => <SearchContainer />,
  "user-profile": ({ username }) => <UserProfileContainer username={username as string} />,
  post: ({ postId }) => <PostContainer postId={postId as string} />,
  terms: () => <TermContainer />,
  crok: ({ activeUser, authModalId }) => (
    <CrokContainer activeUser={activeUser} authModalId={authModalId} />
  ),
  "not-found": () => <NotFoundContainer />,
};

const ServerApp = ({
  activeUser,
  helmetContext,
  pageName,
  pageProps,
}: {
  activeUser: Models.User | null;
  helmetContext: Record<string, unknown>;
  pageName: PageName;
  pageProps: Record<string, unknown>;
}) => {
  const authModalId = useId();
  const newPostModalId = useId();
  const handleLogout = useCallback(() => {}, []);

  const renderPage = PAGE_MAP[pageName];
  const content = renderPage({ activeUser, authModalId, ...pageProps });

  return (
    <HelmetProvider context={helmetContext}>
      <AppPage
        activeUser={activeUser}
        authModalId={authModalId}
        newPostModalId={newPostModalId}
        onLogout={handleLogout}
      >
        {content}
      </AppPage>

      <AuthModalContainer id={authModalId} onUpdateActiveUser={() => {}} />
      <NewPostModalContainer id={newPostModalId} />
    </HelmetProvider>
  );
};

function createFreshStore() {
  const rootReducer = combineReducers({
    form: formReducer,
  });
  return createStore(rootReducer);
}

export function render(pageName: string, pageProps: Record<string, unknown>, ssrData: SSRPayload) {
  const store = createFreshStore();
  const helmetContext: Record<string, unknown> = {};

  const html = renderToString(
    <Provider store={store}>
      <SSRDataContext.Provider value={ssrData.routeData}>
        <ServerApp
          activeUser={ssrData.activeUser}
          helmetContext={helmetContext}
          pageName={pageName as PageName}
          pageProps={pageProps}
        />
      </SSRDataContext.Provider>
    </Provider>,
  );

  return { html, helmetContext };
}

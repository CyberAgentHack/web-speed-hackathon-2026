import { renderToString } from "react-dom/server";
import { Provider } from "react-redux";
import { StaticRouter } from "react-router";
import { Route, Routes } from "react-router";
import { combineReducers, legacy_createStore as createStore } from "redux";
import { reducer as formReducer } from "redux-form";
import { Helmet, HelmetProvider } from "react-helmet";
import { useCallback, useId } from "react";

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

const ServerApp = ({
  activeUser,
  helmetContext,
}: {
  activeUser: Models.User | null;
  helmetContext: Record<string, unknown>;
}) => {
  const authModalId = useId();
  const newPostModalId = useId();
  const handleLogout = useCallback(() => {}, []);

  return (
    <HelmetProvider context={helmetContext}>
      <AppPage
        activeUser={activeUser}
        authModalId={authModalId}
        newPostModalId={newPostModalId}
        onLogout={handleLogout}
      >
        <Routes>
          <Route element={<TimelineContainer />} path="/" />
          <Route
            element={<DirectMessageListContainer activeUser={activeUser} authModalId={authModalId} />}
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
          <Route element={<CrokContainer activeUser={activeUser} authModalId={authModalId} />} path="/crok" />
          <Route element={<NotFoundContainer />} path="*" />
        </Routes>
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

export function render(url: string, ssrData: SSRPayload) {
  const store = createFreshStore();
  const helmetContext: Record<string, unknown> = {};

  const html = renderToString(
    <Provider store={store}>
      <StaticRouter location={url}>
        <SSRDataContext.Provider value={ssrData.routeData}>
          <ServerApp activeUser={ssrData.activeUser} helmetContext={helmetContext} />
        </SSRDataContext.Provider>
      </StaticRouter>
    </Provider>,
  );

  return { html, helmetContext };
}

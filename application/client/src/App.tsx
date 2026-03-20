import { lazy } from "react";
import { Route, Routes } from "react-router";

import { AppLayoutContainer } from "@web-speed-hackathon-2026/client/src/Layout";

const CrokContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then((module) => ({
    default: module.CrokContainer,
  })),
);
const DirectMessageContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer").then(
    (module) => ({ default: module.DirectMessageContainer }),
  ),
);
const DirectMessageListContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer").then(
    (module) => ({ default: module.DirectMessageListContainer }),
  ),
);
const NotFoundContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/NotFoundContainer").then((module) => ({
    default: module.NotFoundContainer,
  })),
);
const PostContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/PostContainer").then((module) => ({
    default: module.PostContainer,
  })),
);
const SearchContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/SearchContainer").then((module) => ({
    default: module.SearchContainer,
  })),
);
const TermContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/TermContainer").then((module) => ({
    default: module.TermContainer,
  })),
);
const TimelineContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/TimelineContainer").then((module) => ({
    default: module.TimelineContainer,
  })),
);
const UserProfileContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then((module) => ({
    default: module.UserProfileContainer,
  })),
);

export const AppContainer = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayoutContainer />}>
        <Route element={<TimelineContainer />} index />
        <Route element={<DirectMessageListContainer />} path="/dm" />
        <Route element={<DirectMessageContainer />} path="/dm/:conversationId" />
        <Route element={<SearchContainer />} path="/search" />
        <Route element={<UserProfileContainer />} path="/users/:username" />
        <Route element={<PostContainer />} path="/posts/:postId" />
        <Route element={<TermContainer />} path="/terms" />
        <Route element={<CrokContainer />} path="/crok" />
        <Route element={<NotFoundContainer />} path="*" />
      </Route>
    </Routes>
  );
};

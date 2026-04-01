import { lazy } from "react";
import { createBrowserRouter, Route, Routes } from "react-router";

import { Layout } from "@web-speed-hackathon-2026/client/src/Layout";

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

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <TimelineContainer /> },
      { path: "/dm", element: <DirectMessageListContainer /> },
      { path: "/dm/:conversationId", element: <DirectMessageContainer /> },
      { path: "/search", element: <SearchContainer /> },
      { path: "/users/:username", element: <UserProfileContainer /> },
      { path: "/posts/:postId", element: <PostContainer /> },
      { path: "/terms", element: <TermContainer /> },
      { path: "/crok", element: <CrokContainer /> },
      { path: "*", element: <NotFoundContainer /> },
      { path: "*", element: <NotFoundContainer /> },
    ],
  },
]);

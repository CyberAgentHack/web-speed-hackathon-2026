import { Route, Routes } from "react-router";

import { CrokContainer } from "@web-speed-hackathon-2026/client/src/containers/CrokContainer";
import { DirectMessageContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer";
import { DirectMessageListContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { PostContainer } from "@web-speed-hackathon-2026/client/src/containers/PostContainer";
import { SearchContainer } from "@web-speed-hackathon-2026/client/src/containers/SearchContainer";
import { TermContainer } from "@web-speed-hackathon-2026/client/src/containers/TermContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { UserProfileContainer } from "@web-speed-hackathon-2026/client/src/containers/UserProfileContainer";
import { AppLayoutContainer } from "@web-speed-hackathon-2026/client/src/Layout";

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

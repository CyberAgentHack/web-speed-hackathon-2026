import { DirectMessageListContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer";

import "../styles/dm-list.css";
import { createPage } from "./create-page";

createPage(({ activeUser, authModalId }) => (
  <DirectMessageListContainer activeUser={activeUser} authModalId={authModalId} />
));

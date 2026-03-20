import { DirectMessageContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer";

import "../styles/dm.css";
import { createPage } from "./create-page";

const conversationId = window.location.pathname.split("/")[2] || "";

createPage(({ activeUser, authModalId }) => (
  <DirectMessageContainer activeUser={activeUser} authModalId={authModalId} conversationId={conversationId} />
));

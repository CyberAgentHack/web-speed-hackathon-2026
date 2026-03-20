import { CrokContainer } from "@web-speed-hackathon-2026/client/src/containers/CrokContainer";

import { createPage } from "./create-page";

createPage(({ activeUser, authModalId }) => (
  <CrokContainer activeUser={activeUser} authModalId={authModalId} />
));

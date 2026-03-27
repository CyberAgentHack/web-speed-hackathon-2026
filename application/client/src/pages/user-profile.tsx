import { UserProfileContainer } from "@web-speed-hackathon-2026/client/src/containers/UserProfileContainer";

import "../styles/user-profile.css";
import { createPage } from "./create-page";

const username = decodeURIComponent(window.location.pathname.split("/")[2] || "");

createPage(() => <UserProfileContainer username={username} />);

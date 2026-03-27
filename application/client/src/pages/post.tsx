import { PostContainer } from "@web-speed-hackathon-2026/client/src/containers/PostContainer";

import "../styles/post.css";
import { createPage } from "./create-page";

const postId = window.location.pathname.split("/")[2] || "";

createPage(() => <PostContainer postId={postId} />);

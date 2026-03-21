import { preloadJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const POST_DETAIL_PATH = /^\/posts\/([^/?#]+)/;
const DIRECT_MESSAGE_DETAIL_PATH = /^\/dm\/([^/?#]+)/;

export function preloadRouteData(pathname: string): void {
  const postMatch = pathname.match(POST_DETAIL_PATH);
  if (postMatch?.[1] != null) {
    void preloadJSON<Models.Post>(`/api/v1/posts/${postMatch[1]}`);
  }

  const directMessageMatch = pathname.match(DIRECT_MESSAGE_DETAIL_PATH);
  if (directMessageMatch?.[1] != null) {
    void preloadJSON<Models.DirectMessageConversation>(`/api/v1/dm/${directMessageMatch[1]}`);
  }
}

import { preloadJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const POST_DETAIL_PATH = /^\/posts\/([^/?#]+)/;

export function preloadRouteData(pathname: string): void {
  const postMatch = pathname.match(POST_DETAIL_PATH);
  if (postMatch?.[1] == null) {
    return;
  }

  void preloadJSON<Models.Post>(`/api/v1/posts/${postMatch[1]}`);
}

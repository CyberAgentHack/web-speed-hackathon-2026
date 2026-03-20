import type { SSRData } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";

/**
 * window.__SSR_DATA__ を SWR の fallback 形式（key → data マップ）に変換する。
 * useSWRInfinite の最初のページは `?limit=30&offset=0` 付きの URL がキーになる。
 */
export function buildSWRFallback(
  pathname: string,
  ssrData: SSRData | undefined,
): Record<string, unknown> {
  if (!ssrData) return {};

  const fallback: Record<string, unknown> = {};

  // activeUser
  if ("activeUser" in ssrData) {
    fallback["/api/v1/me"] = ssrData.activeUser;
  }

  // timeline: /
  if (ssrData.posts != null && pathname === "/") {
    fallback["/api/v1/posts?limit=30&offset=0"] = ssrData.posts;
  }

  // search: /search?q=...
  if (ssrData.posts != null && pathname.startsWith("/search")) {
    const url = new URL(pathname, "http://localhost");
    const q = url.searchParams.get("q");
    if (q) {
      fallback[`/api/v1/search?q=${encodeURIComponent(q)}&limit=30&offset=0`] = ssrData.posts;
    }
  }

  // post detail: /posts/:postId
  const postMatch = pathname.match(/^\/posts\/([^/]+)$/);
  if (postMatch) {
    const postId = postMatch[1]!;
    if (ssrData.post !== undefined) {
      fallback[`/api/v1/posts/${postId}`] = ssrData.post;
    }
    if (ssrData.comments != null) {
      fallback[`/api/v1/posts/${postId}/comments?limit=30&offset=0`] = ssrData.comments;
    }
  }

  // user profile: /users/:username
  const userMatch = pathname.match(/^\/users\/([^/]+)$/);
  if (userMatch) {
    const username = userMatch[1]!;
    if (ssrData.user !== undefined) {
      fallback[`/api/v1/users/${username}`] = ssrData.user;
    }
    if (ssrData.userPosts != null) {
      fallback[`/api/v1/users/${username}/posts?limit=30&offset=0`] = ssrData.userPosts;
    }
  }

  return fallback;
}

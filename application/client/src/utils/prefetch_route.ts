type RouteKey = "timeline" | "search" | "dm-list" | "user-profile" | "terms" | "crok";

interface RoutePrefetcher {
  key: RouteKey;
  matches: (pathname: string) => boolean;
  load: () => Promise<unknown>;
}

const routePrefetchers: RoutePrefetcher[] = [
  {
    key: "timeline",
    matches: (pathname) => pathname === "/",
    load: () => import("@web-speed-hackathon-2026/client/src/containers/TimelineContainer"),
  },
  {
    key: "search",
    matches: (pathname) => pathname === "/search",
    load: () => import("@web-speed-hackathon-2026/client/src/containers/SearchContainer"),
  },
  {
    key: "dm-list",
    matches: (pathname) => pathname.startsWith("/dm"),
    load: () =>
      Promise.all([
        import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer"),
        import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer"),
      ]),
  },
  {
    key: "user-profile",
    matches: (pathname) => pathname.startsWith("/users/"),
    load: () => import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer"),
  },
  {
    key: "terms",
    matches: (pathname) => pathname === "/terms",
    load: () => import("@web-speed-hackathon-2026/client/src/containers/TermContainer"),
  },
  {
    key: "crok",
    matches: (pathname) => pathname === "/crok",
    load: () => import("@web-speed-hackathon-2026/client/src/containers/CrokContainer"),
  },
];

const prefetchedRouteKeys = new Set<RouteKey>();

function normalizePathname(href: string): string {
  try {
    return new URL(href, window.location.origin).pathname;
  } catch {
    return href;
  }
}

export function prefetchRoute(href: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const pathname = normalizePathname(href);
  const routePrefetcher = routePrefetchers.find((entry) => entry.matches(pathname));
  if (routePrefetcher == null || prefetchedRouteKeys.has(routePrefetcher.key)) {
    return;
  }

  prefetchedRouteKeys.add(routePrefetcher.key);
  void routePrefetcher.load().catch(() => {
    prefetchedRouteKeys.delete(routePrefetcher.key);
  });
}

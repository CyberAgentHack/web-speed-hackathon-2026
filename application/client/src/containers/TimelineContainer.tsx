import { useCallback, useRef } from "react";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { useTitle } from "@web-speed-hackathon-2026/client/src/hooks/use_title";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const TimelineContainer = () => {
  const preloadUsed = useRef(false);

  const fetcher = useCallback(async (url: string) => {
    const preloaded = (window as any).__PRELOAD_POSTS as Promise<Response> | undefined;
    if (!preloadUsed.current && preloaded) {
      preloadUsed.current = true;
      const res = await preloaded;
      if (res.ok) return res.json() as Promise<Models.Post[]>;
    }
    return fetchJSON<Models.Post[]>(url);
  }, []);

  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>("/api/v1/posts", fetcher);

  useTitle("タイムライン - CaX");

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <TimelinePage timeline={posts} />
    </InfiniteScroll>
  );
};

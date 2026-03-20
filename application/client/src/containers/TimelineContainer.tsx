import { useState } from "react";
import { Helmet } from "react-helmet";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const TimelineContainer = () => {
  const [initialLimit] = useState(() => {
    if (typeof window === "undefined") {
      return 8;
    }
    const estimatedItemHeight = window.innerWidth < 640 ? 420 : 520;
    const count = Math.ceil(window.innerHeight / estimatedItemHeight) + 1;
    return Math.min(30, Math.max(4, count));
  });

  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>("/api/v1/posts", fetchJSON, {
    initialLimit,
    pageLimit: 30,
  });

  return (
    <InfiniteScroll fetchMore={fetchMore} freezeUntilScroll items={posts}>
      <Helmet>
        <title>タイムライン - CaX</title>
      </Helmet>
      <TimelinePage timeline={posts} />
    </InfiniteScroll>
  );
};

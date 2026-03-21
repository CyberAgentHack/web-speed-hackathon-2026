import { Helmet } from "react-helmet";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const TimelineContainer = () => {
  const {
    data: posts,
    fetchMore,
    hasMore,
    isLoading,
  } = useInfiniteFetch<Models.Post>("/api/v1/posts", fetchJSON, {
    initialLimit: 10,
    limit: 10,
  });

  return (
    <InfiniteScroll fetchMore={fetchMore} hasMore={hasMore} isLoading={isLoading}>
      <Helmet>
        <title>タイムライン - CaX</title>
      </Helmet>
      <TimelinePage timeline={posts} />
    </InfiniteScroll>
  );
};

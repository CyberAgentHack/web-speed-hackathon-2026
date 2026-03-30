import { Helmet } from "react-helmet";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { Pagination, useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { useCallback } from "react";

export const TimelineContainer = () => {
  const fetcher = useCallback(async (page: Pagination) => {
    console.log("fetcher called!:", page);
    return await fetchJSON<Models.Post[]>("/api/v1/posts", page);
  }, []);

  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>(fetcher);

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <Helmet>
        <title>タイムライン - CaX</title>
      </Helmet>
      <TimelinePage timeline={posts} />
    </InfiniteScroll>
  );
};

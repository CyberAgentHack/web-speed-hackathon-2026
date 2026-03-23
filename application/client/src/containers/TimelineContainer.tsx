import { Helmet } from "react-helmet";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const TimelineContainer = () => {
  const { data: posts, fetchMore, hasMore, isLoading } = useInfiniteFetch<Models.Post>(
    "/api/v1/posts",
    fetchJSON,
    { limit: 10 },
  );

  return (
    <InfiniteScroll fetchMore={fetchMore} hasMore={hasMore} items={posts}>
      <Helmet>
        <title>タイムライン - CaX</title>
      </Helmet>
      {isLoading && posts.length === 0 ? (
        <div className="text-cax-text-muted px-4 py-8 text-center">タイムラインを読み込み中...</div>
      ) : (
        <TimelinePage timeline={posts} />
      )}
    </InfiniteScroll>
  );
};

import { Helmet } from "react-helmet";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const TimelineContainer = () => {
  const { data: posts, fetchMore, isLoading } = useInfiniteFetch<Models.Post>("/api/v1/posts", fetchJSON);

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <Helmet>
        <title>タイムライン - CaX</title>
      </Helmet>
      {isLoading && posts.length === 0 && (
        <div className="p-8 text-center text-cax-text-muted text-lg">読込中...</div>
      )}
      <TimelinePage timeline={posts} />
    </InfiniteScroll>
  );
};

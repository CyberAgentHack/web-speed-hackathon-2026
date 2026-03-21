import { Helmet } from "react-helmet";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";

export const TimelineContainer = () => {
  const { data: posts, fetchMore, loading } = useInfiniteFetch<Models.Post>(
    "/api/v1/posts"
  );

  // 初回ロード中
  if (loading && posts.length === 0) {
    return (
      <Helmet>
        <title>読込中 - CaX</title>
      </Helmet>
    );
  }

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <Helmet>
        <title>タイムライン - CaX</title>
      </Helmet>
      <TimelinePage timeline={posts} />
    </InfiniteScroll>
  );
};

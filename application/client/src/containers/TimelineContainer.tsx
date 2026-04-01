import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";

export const TimelineContainer = () => {
  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>("/api/v1/posts");

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <title>タイムライン - CaX</title>
      <TimelinePage timeline={posts} />
    </InfiniteScroll>
  );
};

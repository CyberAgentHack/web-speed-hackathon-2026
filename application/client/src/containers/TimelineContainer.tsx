import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { useTitle } from "@web-speed-hackathon-2026/client/src/hooks/use_title";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const TimelineContainer = () => {
  const { data: posts, fetchMore, hasMore } = useInfiniteFetch<Models.Post>("/api/v1/posts", fetchJSON);

  useTitle("タイムライン - CaX");

  return (
    <InfiniteScroll fetchMore={fetchMore} hasMore={hasMore} items={posts}>
      <TimelinePage timeline={posts} />
    </InfiniteScroll>
  );
};

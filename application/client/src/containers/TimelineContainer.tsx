import { PageTitle } from "@web-speed-hackathon-2026/client/src/components/application/PageTitle";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const TimelineContainer = () => {
  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>("/api/v1/posts", fetchJSON, {
    limit: 15,
  });

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts} waitForScroll={true}>
      <PageTitle title="タイムライン - CaX" />
      <TimelinePage timeline={posts} />
    </InfiniteScroll>
  );
};

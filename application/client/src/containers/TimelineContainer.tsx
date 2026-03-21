import { Helmet } from "react-helmet";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const initialPosts: Models.Post[] | undefined =
  typeof window !== "undefined" && (window as any).__INITIAL_POSTS__
    ? (window as any).__INITIAL_POSTS__
    : undefined;

export const TimelineContainer = () => {
  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>(
    "/api/v1/posts",
    fetchJSON,
    initialPosts,
  );

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <Helmet>
        <title>タイムライン - CaX</title>
      </Helmet>
      <TimelinePage timeline={posts} />
    </InfiniteScroll>
  );
};

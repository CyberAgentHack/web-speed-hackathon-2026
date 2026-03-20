import { Helmet } from "react-helmet";

import { apiClient } from "@web-speed-hackathon-2026/client/src/api/client";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";

interface TimelineContainerProps {
  ssrPosts?: Models.Post[] | undefined;
}

export const TimelineContainer = ({ ssrPosts }: TimelineContainerProps) => {
  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>(
    "/api/v1/posts",
    () => apiClient.posts.$get().then((res) => res.json()),
    ssrPosts,
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

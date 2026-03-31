import { useRef } from "react";

import { Helmet } from "react-helmet";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { consumeInitialData } from "@web-speed-hackathon-2026/client/src/initial_data";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const TimelineContainer = () => {
  const initialPostsRef = useRef(consumeInitialData<Models.Post[]>("/api/v1/posts") ?? []);
  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>("/api/v1/posts", fetchJSON, {
    initialData: initialPostsRef.current,
  });

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <Helmet>
        <title>タイムライン - CaX</title>
      </Helmet>
      <TimelinePage timeline={posts} />
    </InfiniteScroll>
  );
};

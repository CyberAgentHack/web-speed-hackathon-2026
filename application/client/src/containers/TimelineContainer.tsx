import { useState } from "react";

import { Helmet } from "@web-speed-hackathon-2026/client/src/components/foundation/Helmet";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

let hasConsumedClientBootstrapTimeline = false;
const INITIAL_TIMELINE_POST_LIMIT = 8;

function consumeInitialPosts(initialPosts: Models.Post[] | undefined) {
  if (initialPosts == null) {
    return undefined;
  }

  if (typeof window === "undefined") {
    return initialPosts;
  }

  if (hasConsumedClientBootstrapTimeline) {
    return undefined;
  }

  hasConsumedClientBootstrapTimeline = true;
  return initialPosts;
}

interface Props {
  initialPosts?: Models.Post[];
}

export const TimelineContainer = ({ initialPosts }: Props) => {
  const [bootstrappedPosts] = useState(() => consumeInitialPosts(initialPosts));
  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>("/api/v1/posts", fetchJSON, {
    initialData: bootstrappedPosts,
    initialLimit: INITIAL_TIMELINE_POST_LIMIT,
    pageLimit: 24,
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

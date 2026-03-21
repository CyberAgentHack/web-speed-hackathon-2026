import { Helmet } from "react-helmet";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const TimelineContainer = () => {
  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>("/api/v1/posts", fetchJSON);
  const initialPosts = posts.slice(0, 8);
  const hasMoreInitial = posts.length > initialPosts.length;

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <Helmet>
        <title>タイムライン - CaX</title>
      </Helmet>
      <TimelinePage timeline={initialPosts} />
      {hasMoreInitial ? (
        <div className="px-4 py-3">
          <button
            className="border-cax-border bg-cax-surface-subtle text-cax-text w-full rounded-md border px-3 py-2 text-sm hover:opacity-90"
            onClick={fetchMore}
            type="button"
          >
            続きを読み込む
          </button>
        </div>
      ) : null}
    </InfiniteScroll>
  );
};

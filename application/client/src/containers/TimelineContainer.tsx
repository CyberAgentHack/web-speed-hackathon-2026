import { Helmet } from "react-helmet";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const TimelineContainer = () => {
  const { data: posts, fetchMore, isLoading } = useInfiniteFetch<Models.Post>(
    "/api/v1/posts",
    fetchJSON,
    8,
  );

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <Helmet>
        <title>タイムライン - CaX</title>
      </Helmet>
      {isLoading && posts.length === 0 ? (
        <section className="px-4 py-6">
          <div className="border-cax-border bg-cax-surface-subtle rounded-2xl border p-4">
            <p className="text-sm font-bold">タイムラインを読み込み中です...</p>
            <p className="text-cax-text-muted mt-2 text-sm">投稿を準備しています。</p>
          </div>
        </section>
      ) : (
        <TimelinePage timeline={posts} />
      )}
    </InfiniteScroll>
  );
};

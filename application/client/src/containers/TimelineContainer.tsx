import { Helmet } from "react-helmet";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const TimelineContainer = () => {
  const {
    data: posts,
    error,
    fetchMore,
    isLoading,
  } = useInfiniteFetch<Models.Post>("/api/v1/posts", fetchJSON);

  if (posts.length === 0) {
    if (error != null) {
      return <p className="text-cax-danger px-4 py-6 text-sm">タイムラインの取得に失敗しました</p>;
    }
    if (isLoading) {
      return <p className="text-cax-text-subtle px-4 py-6 text-sm">Loading...</p>;
    }
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

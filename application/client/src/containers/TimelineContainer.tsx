import { useState } from "react";
import { Helmet } from "react-helmet";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

function getPreloadedPosts(): Models.Post[] {
  try {
    const el = document.getElementById("__initial_posts__");
    if (el?.textContent) return JSON.parse(el.textContent) as Models.Post[];
  } catch {}
  return [];
}

export const TimelineContainer = () => {
  const { data: posts, fetchMore, isLoading } = useInfiniteFetch<Models.Post>("/api/v1/posts", fetchJSON);
  const [preloaded] = useState<Models.Post[]>(getPreloadedPosts);
  const displayPosts = isLoading && posts.length === 0 ? preloaded : posts;

  return (
    <InfiniteScroll fetchMore={fetchMore} items={displayPosts}>
      <Helmet>
        <title>タイムライン - CaX</title>
      </Helmet>
      {isLoading && displayPosts.length === 0 && (
        <div className="p-8 text-center text-cax-text-muted text-lg">読込中...</div>
      )}
      <TimelinePage timeline={displayPosts} />
    </InfiniteScroll>
  );
};

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

function getInlineInitialPosts(): Models.Post[] | null {
  const el = document.getElementById("initial-posts");
  if (!el || !el.textContent) return null;
  try {
    return JSON.parse(el.textContent);
  } catch {
    return null;
  }
}

const inlinePosts = getInlineInitialPosts();

export const TimelineContainer = () => {
  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>("/api/v1/posts", fetchJSON, inlinePosts);

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <title>タイムライン - CaX</title>
      <TimelinePage timeline={posts} />
    </InfiniteScroll>
  );
};

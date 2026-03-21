import { Helmet } from "react-helmet";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

export const TimelineContainer = () => {
  const { data: posts, fetchMore, error, isLoading } = useInfiniteFetch<Models.Post>(
    "/api/v1/posts",
    fetchJSON,
  );
  const lcpProfileSrc =
    posts[0] != null ? getProfileImagePath(posts[0].user.profileImage.id) : null;

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <div>
        <Helmet>
          <title>タイムライン - CaX</title>
          {lcpProfileSrc != null ? (
            <link rel="preload" as="image" href={lcpProfileSrc} />
          ) : null}
        </Helmet>
        <h1>タイムライン</h1>
        {error != null ? (
          <p className="text-cax-danger px-4 py-8 text-center text-sm">
            タイムラインの読み込みに失敗しました
          </p>
        ) : isLoading && posts.length === 0 ? (
          <>
            <p aria-busy="true" className="text-cax-text-muted px-4 py-8 text-center">
              読込中...
            </p>
            <article className="px-1 sm:px-4">
              <p className="text-cax-text-muted border-cax-border border-b px-2 py-4 sm:px-4">
                読込中...
              </p>
            </article>
          </>
        ) : (
          <TimelinePage timeline={posts} />
        )}
      </div>
    </InfiniteScroll>
  );
};

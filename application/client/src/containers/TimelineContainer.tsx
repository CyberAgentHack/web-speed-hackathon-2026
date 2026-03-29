import { Helmet } from "react-helmet";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { getImagePath, getMoviePosterPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

const HOME_INITIAL_POST_LIMIT = 12;

export const TimelineContainer = () => {
  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>(
    "/api/v1/posts",
    fetchJSON,
    HOME_INITIAL_POST_LIMIT,
  );
  const firstPost = posts[0];
  const preloadImageHref = firstPost?.images?.[0]?.id ? getImagePath(firstPost.images[0].id) : null;
  const preloadPosterHref = firstPost?.movie?.id ? getMoviePosterPath(firstPost.movie.id) : null;

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts} runInitialCheck={false}>
      <Helmet>
        <title>タイムライン - CaX</title>
        {preloadImageHref ? <link rel="preload" as="image" href={preloadImageHref} /> : null}
        {!preloadImageHref && preloadPosterHref ? (
          <link rel="preload" as="image" href={preloadPosterHref} />
        ) : null}
      </Helmet>
      <TimelinePage timeline={posts} />
    </InfiniteScroll>
  );
};

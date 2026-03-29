import { Helmet } from "react-helmet";
import { Provider } from "react-redux";

import { SearchPage } from "@web-speed-hackathon-2026/client/src/components/application/SearchPage";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { useSearchParams } from "@web-speed-hackathon-2026/client/src/hooks/use_search_params";
import { store } from "@web-speed-hackathon-2026/client/src/store";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { getImagePath, getMoviePosterPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

const SEARCH_INITIAL_POST_LIMIT = 12;

export const SearchContainer = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>(
    query ? `/api/v1/search?q=${encodeURIComponent(query)}` : "",
    fetchJSON,
    SEARCH_INITIAL_POST_LIMIT,
  );
  const firstPost = posts[0];
  const preloadImageHref = firstPost?.images?.[0]?.id ? getImagePath(firstPost.images[0].id) : null;
  const preloadPosterHref = firstPost?.movie?.id ? getMoviePosterPath(firstPost.movie.id) : null;

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <Helmet>
        <title>検索 - CaX</title>
        {preloadImageHref ? <link rel="preload" as="image" href={preloadImageHref} /> : null}
        {!preloadImageHref && preloadPosterHref ? (
          <link rel="preload" as="image" href={preloadPosterHref} />
        ) : null}
      </Helmet>
      <Provider store={store}>
        <SearchPage query={query} results={posts} initialValues={{ searchText: query }} />
      </Provider>
    </InfiniteScroll>
  );
};

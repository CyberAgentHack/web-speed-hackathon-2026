import { Helmet } from "react-helmet";

import { SearchPage } from "@web-speed-hackathon-2026/client/src/components/application/SearchPage";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { useSearchParams } from "react-router";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const SearchContainer = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const { data: posts, fetchMore, isLoading } = useInfiniteFetch<Models.Post>(
    query ? `/api/v1/search?q=${encodeURIComponent(query)}` : "",
    fetchJSON,
  );

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <Helmet>
        <title>検索 - CaX</title>
      </Helmet>
      <SearchPage query={query} results={posts} isLoading={isLoading} />
    </InfiniteScroll>
  );
};

import { useMemo } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "react-router";

import { SearchPage } from "@web-speed-hackathon-2026/client/src/components/application/SearchPage";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const SearchContainer = () => {
  const location = useLocation();
  const query = useMemo(() => new URLSearchParams(location.search).get("q") || "", [location.search]);

  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>(
    query ? `/api/v1/search?q=${encodeURIComponent(query)}` : "",
    fetchJSON,
  );

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <Helmet>
        <title>検索 - CaX</title>
      </Helmet>
      <SearchPage query={query} results={posts} initialValues={{ searchText: query }} />
    </InfiniteScroll>
  );
};

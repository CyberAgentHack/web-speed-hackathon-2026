import { Helmet } from "react-helmet";

import { SearchPage } from "@web-speed-hackathon-2026/client/src/components/application/SearchPage";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { Pagination, useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { useSearchParams } from "react-router";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { useCallback, useMemo } from "react";

export const SearchContainer = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const fetcher = useCallback((page: Pagination) => {
    return fetchJSON<Models.Post[]>(`/api/v1/search`, {
      ...page,
      q: query ? encodeURIComponent(query) : undefined,
    })
  }, [query]);

  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>(fetcher);

  const initialValues = useMemo(() => ({ searchText: query }), [query]);

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <Helmet>
        <title>検索 - CaX</title>
      </Helmet>
      <SearchPage query={query} results={posts} initialValues={initialValues} />
    </InfiniteScroll>
  );
};

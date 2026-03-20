import { useCallback, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";

import { SearchPage } from "@web-speed-hackathon-2026/client/src/components/application/SearchPage";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { useSearchParams } from "@web-speed-hackathon-2026/client/src/hooks/use_search_params";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const SearchContainer = () => {
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(urlQuery);
  const pendingUrlQueryRef = useRef<string | null>(null);
  const encodedQuery = encodeURIComponent(query);

  useEffect(() => {
    if (pendingUrlQueryRef.current !== null) {
      return;
    }
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    if (pendingUrlQueryRef.current === null) {
      return;
    }

    pendingUrlQueryRef.current = null;
    const nextSearch = query ? `?q=${encodeURIComponent(query)}` : "";
    if (window.location.search !== nextSearch) {
      window.history.pushState(null, "", `${window.location.pathname}${nextSearch}`);
    }
  }, [query]);

  const handleSearch = useCallback((nextQuery: string) => {
    pendingUrlQueryRef.current = nextQuery;
    setQuery(nextQuery);
  }, []);

  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>(
    query ? `/api/v1/search?q=${encodedQuery}` : "",
    fetchJSON,
  );
  const { data: sentiment } = useFetch<{ isNegative: boolean }>(
    `/api/v1/search/sentiment?q=${encodedQuery}`,
    fetchJSON,
  );

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <Helmet>
        <title>検索 - CaX</title>
      </Helmet>
      <SearchPage
        isNegative={sentiment?.isNegative ?? false}
        onSearch={handleSearch}
        query={query}
        results={posts}
      />
    </InfiniteScroll>
  );
};

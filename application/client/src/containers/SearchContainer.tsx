import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet";

import { SearchPage } from "@web-speed-hackathon-2026/client/src/components/application/SearchPage";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { useSearchParams } from "@web-speed-hackathon-2026/client/src/hooks/use_search_params";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

type SearchResponse = {
  posts: Models.Post[];
  isNegative: boolean;
};

export const SearchContainer = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [isNegative, setIsNegative] = useState(false);

  useEffect(() => {
    setIsNegative(false);
  }, [query]);

  const searchFetcher = useCallback(async (url: string): Promise<Models.Post[]> => {
    const response = await fetchJSON<SearchResponse>(url);
    setIsNegative(response.isNegative);
    return response.posts;
  }, []);

  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>(
    query ? `/api/v1/search?q=${encodeURIComponent(query)}` : "",
    searchFetcher,
  );

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <Helmet>
        <title>検索 - CaX</title>
      </Helmet>
      <SearchPage query={query} results={posts} isNegative={isNegative} initialValues={{ searchText: query }} />
    </InfiniteScroll>
  );
};

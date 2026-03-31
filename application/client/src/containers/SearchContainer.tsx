import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet";

import { SearchPage } from "@web-speed-hackathon-2026/client/src/components/application/SearchPage";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { useSearchParams } from "@web-speed-hackathon-2026/client/src/hooks/use_search_params";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface SearchResponse {
  isNegativeQuery: boolean;
  posts: Models.Post[];
}

export const SearchContainer = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [isNegativeQuery, setIsNegativeQuery] = useState(false);

  useEffect(() => {
    setIsNegativeQuery(false);
  }, [query]);

  const fetchSearchPosts = useCallback(async (apiPath: string): Promise<Models.Post[]> => {
    const response = await fetchJSON<SearchResponse>(apiPath);
    setIsNegativeQuery(response.isNegativeQuery);
    return response.posts;
  }, []);

  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>(
    query ? `/api/v1/search?q=${encodeURIComponent(query)}` : "",
    fetchSearchPosts,
  );

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <Helmet>
        <title>検索 - CaX</title>
      </Helmet>
      <SearchPage
        query={query}
        results={posts}
        isNegativeQuery={isNegativeQuery}
        initialValues={{ searchText: query }}
      />
    </InfiniteScroll>
  );
};

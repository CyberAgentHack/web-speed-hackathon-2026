import { useCallback, useState } from "react";
import { Helmet } from "react-helmet";

import { SearchPage } from "@web-speed-hackathon-2026/client/src/components/application/SearchPage";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { useSearchParams } from "@web-speed-hackathon-2026/client/src/hooks/use_search_params";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const SearchContainer = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [isNegative, setIsNegative] = useState(false);

  const fetchSearch = useCallback(async (apiPath: string): Promise<Models.Post[]> => {
    const result = await fetchJSON<{ posts: Models.Post[]; isNegative: boolean }>(apiPath);
    setIsNegative(result.isNegative);
    return result.posts;
  }, []);

  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>(
    query ? `/api/v1/search?q=${encodeURIComponent(query)}` : "",
    fetchSearch,
  );

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <Helmet>
        <title>検索 - CaX</title>
      </Helmet>
      <SearchPage
        query={query}
        results={posts}
        isNegative={isNegative}
        initialValues={{ searchText: query }}
      />
    </InfiniteScroll>
  );
};

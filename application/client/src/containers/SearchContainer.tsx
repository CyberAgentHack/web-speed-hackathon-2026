import { Helmet } from "react-helmet";

import { SearchPage } from "@web-speed-hackathon-2026/client/src/components/application/SearchPage";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { useSearchParams } from "@web-speed-hackathon-2026/client/src/hooks/use_search_params";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { useFetch } from "../hooks/use_fetch";

export const SearchContainer = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>(
    query ? `/api/v1/search?q=${encodeURIComponent(query)}` : "",
    fetchJSON,
  );

  const { data: sentiment, isLoading: isLoadingSentiment } = useFetch<{ score: number; label: "positive" | "negative" | "neutral" }>(
      `/api/v1/analyze?q=${encodeURIComponent(query)}`,
      fetchJSON,
    );

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <Helmet>
        <title>検索 - CaX</title>
      </Helmet>
      <SearchPage query={query} results={posts} initialValues={{ searchText: query }}  sentiment={sentiment ?? undefined} isLoadingSentiment={isLoadingSentiment} />
    </InfiniteScroll>
  );
};

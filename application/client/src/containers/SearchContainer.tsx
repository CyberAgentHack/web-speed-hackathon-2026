import { Helmet } from "react-helmet";

import { SearchPage } from "@web-speed-hackathon-2026/client/src/components/application/SearchPage";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { useSearchParams } from "@web-speed-hackathon-2026/client/src/hooks/use_search_params";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface SentimentResult {
  label: "positive" | "negative" | "neutral";
  score: number;
}

export const SearchContainer = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const sentimentApiPath = query ? `/api/v1/search/sentiment?q=${encodeURIComponent(query)}` : "";

  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>(
    query ? `/api/v1/search?q=${encodeURIComponent(query)}` : "",
    fetchJSON,
  );
  const { data: sentiment } = useFetch<SentimentResult>(sentimentApiPath, fetchJSON);

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <Helmet>
        <title>検索 - CaX</title>
      </Helmet>
      <SearchPage
        isNegative={sentiment?.label === "negative"}
        query={query}
        results={posts}
        initialValues={{ searchText: query }}
      />
    </InfiniteScroll>
  );
};

import { Helmet } from "react-helmet";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";

import { SearchPage } from "@web-speed-hackathon-2026/client/src/components/application/SearchPage";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { parseSearchQuery } from "@web-speed-hackathon-2026/client/src/search/services";
import { ReduxFormProvider } from "@web-speed-hackathon-2026/client/src/store/ReduxFormProvider";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const SearchContainer = () => {
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const query = searchParams.get("q") || "";
  const [isNegative, setIsNegative] = useState(false);

  const {
    data: posts,
    fetchMore,
    hasMore,
    isLoading,
  } = useInfiniteFetch<Models.Post>(
    query ? `/api/v1/search?q=${encodeURIComponent(query)}` : "",
    fetchJSON,
    {
      initialLimit: 10,
    },
  );

  useEffect(() => {
    const { keywords } = parseSearchQuery(query);
    if (!keywords) {
      setIsNegative(false);
      return;
    }

    const abortController = new AbortController();
    void fetch(`/api/v1/search/sentiment?q=${encodeURIComponent(query)}`, {
      signal: abortController.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Unexpected status: ${response.status}`);
        }
        return (await response.json()) as { label: "positive" | "negative" | "neutral" };
      })
      .then((result) => {
        setIsNegative(result.label === "negative");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setIsNegative(false);
      });

    return () => {
      abortController.abort();
    };
  }, [query]);

  return (
    <InfiniteScroll fetchMore={fetchMore} hasMore={hasMore} isLoading={isLoading}>
      <Helmet>
        <title>検索 - CaX</title>
      </Helmet>
      <ReduxFormProvider>
        <SearchPage
          isNegative={isNegative}
          isLoading={isLoading}
          query={query}
          results={posts}
          initialValues={{ searchText: query }}
        />
      </ReduxFormProvider>
    </InfiniteScroll>
  );
};

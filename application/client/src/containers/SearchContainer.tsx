import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";

import { SearchPage } from "@web-speed-hackathon-2026/client/src/components/application/SearchPage";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { useSearchParams } from "@web-speed-hackathon-2026/client/src/hooks/use_search_params";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

async function fetchSearchResults(url: string): Promise<Models.Post[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json() as Promise<Models.Post[]>;
}

export const SearchContainer = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const apiPath = query ? `/api/v1/search?q=${encodeURIComponent(query)}` : "";

  useEffect(() => {
    if (!apiPath) {
      setTotalCount(null);
      return;
    }
    fetch(apiPath)
      .then((res) => {
        const count = res.headers.get("X-Total-Count");
        if (count != null) setTotalCount(Number(count));
      })
      .catch(() => {});
  }, [apiPath]);

  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>(
    apiPath,
    fetchJSON,
  );

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <Helmet>
        <title>検索 - CaX</title>
      </Helmet>
      <SearchPage query={query} results={posts} totalCount={totalCount} initialValues={{ searchText: query }} />
    </InfiniteScroll>
  );
};

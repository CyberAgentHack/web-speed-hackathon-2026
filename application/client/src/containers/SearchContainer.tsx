import { Helmet } from "react-helmet";
import useSWRInfinite from "swr/infinite";

import { createInfiniteKey } from "@web-speed-hackathon-2026/client/src/api/swr";
import { SearchPage } from "@web-speed-hackathon-2026/client/src/components/application/SearchPage";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { useSearchParams } from "@web-speed-hackathon-2026/client/src/hooks/use_search_params";

export const SearchContainer = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const getKey = query
    ? createInfiniteKey(`/api/v1/search?q=${encodeURIComponent(query)}`)
    : () => null;

  const { data, setSize } = useSWRInfinite<Models.Post[]>(getKey, {
    revalidateFirstPage: false,
  });

  const posts = data ? data.flat() : [];

  return (
    <InfiniteScroll fetchMore={() => setSize((s) => s + 1)} items={posts}>
      <Helmet>
        <title>検索 - CaX</title>
      </Helmet>
      <SearchPage query={query} results={posts} initialValues={{ searchText: query }} />
    </InfiniteScroll>
  );
};

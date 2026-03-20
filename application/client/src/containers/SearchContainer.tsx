import { useRef } from "react";
import useSWRInfinite from "swr/infinite";

import { getSSRData } from "@web-speed-hackathon-2026/client/src/api/ssr-data";
import { createInfiniteKey } from "@web-speed-hackathon-2026/client/src/api/swr";
import { SearchPage } from "@web-speed-hackathon-2026/client/src/components/application/SearchPage";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { useSearchParams } from "@web-speed-hackathon-2026/client/src/hooks/use_search_params";

export const SearchContainer = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const ssrRef = useRef(getSSRData());
  const ssrPosts = ssrRef.current?.posts;

  const getKey = query
    ? createInfiniteKey(`/api/v1/search?q=${encodeURIComponent(query)}`)
    : () => null;

  const PAGE_SIZE = 30;
  const { data, setSize, isValidating } = useSWRInfinite<Models.Post[]>(getKey, {
    revalidateFirstPage: false,
    ...(ssrPosts ? { fallbackData: [ssrPosts], revalidateOnMount: false } : {}),
  });

  const posts = data ? data.flat() : (ssrPosts ?? []);
  const hasMore = data ? (data[data.length - 1]?.length ?? 0) >= PAGE_SIZE : true;

  return (
    <InfiniteScroll
      fetchMore={() => setSize((s) => s + 1)}
      items={posts}
      hasMore={hasMore}
      isLoading={isValidating}
    >
      <title>検索 - CaX</title>
      <SearchPage query={query} results={posts} initialValues={{ searchText: query }} />
    </InfiniteScroll>
  );
};

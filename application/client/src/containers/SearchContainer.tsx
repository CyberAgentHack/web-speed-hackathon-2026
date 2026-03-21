import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { SearchPage } from "../components/application/SearchPage";
import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

export const SearchContainer = ({ query }: { query: string | undefined }) => {
  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>(
    "/api/v1/search",
    useCallback(
      (url, queryParam) =>
        fetchJSON(
          url,
          query == null
            ? queryParam
            : {
                ...queryParam,
                q: query,
              },
        ),
      [],
    ),
  );

  const { data: total } = useQuery({
    queryKey: ["search-total", query],
    queryFn: () =>
      fetchJSON<{ total: number }>("/api/v1/search-total", {
        q: query ?? "",
      }),
  });

  console.log(total);

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <title>検索 - CaX</title>
      <SearchPage
        query={query ?? ""}
        results={posts}
        total={total?.total ?? 0}
        initialValues={{ searchText: query }}
      />
    </InfiniteScroll>
  );
};

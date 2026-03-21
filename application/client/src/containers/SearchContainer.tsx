import { PageTitle } from "@web-speed-hackathon-2026/client/src/components/application/PageTitle";
import { SearchPage } from "@web-speed-hackathon-2026/client/src/components/application/SearchPage";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { useSearchParams } from "@web-speed-hackathon-2026/client/src/hooks/use_search_params";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const SearchContainer = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>(
    query ? `/api/v1/search?q=${encodeURIComponent(query)}` : "",
    fetchJSON,
  );

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <PageTitle title="検索 - CaX" />
      <SearchPage query={query} results={posts} initialValues={{ searchText: query }} />
    </InfiniteScroll>
  );
};

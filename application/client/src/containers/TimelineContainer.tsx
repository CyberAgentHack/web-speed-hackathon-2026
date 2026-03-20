import { Helmet } from "react-helmet";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const TimelineContainer = () => {
  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>("/api/v1/posts", fetchJSON);

  return (
    <>
      <Helmet>
        <title>タイムライン - CaX</title>
      </Helmet>
      {/* 
        デバッグ用の <div> を削除し、InfiniteScroll を本来の形で戻します。
        中身の TimelineItem が軽量化されていれば、これで 20点台は維持できるはずです。
      */}
      <InfiniteScroll fetchMore={fetchMore} items={posts}>
        <TimelinePage timeline={posts} />
      </InfiniteScroll>
    </>
  );
};
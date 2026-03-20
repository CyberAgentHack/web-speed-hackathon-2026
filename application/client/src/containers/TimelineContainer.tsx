import { useRef } from "react";
import useSWRInfinite from "swr/infinite";

import { getSSRData } from "@web-speed-hackathon-2026/client/src/api/ssr-data";
import { createInfiniteKey } from "@web-speed-hackathon-2026/client/src/api/swr";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";

const getKey = createInfiniteKey("/api/v1/posts");

const PAGE_SIZE = 30;

export const TimelineContainer = () => {
  const ssrRef = useRef(getSSRData());
  const ssrPosts = ssrRef.current?.posts;

  const { data, setSize, isValidating } = useSWRInfinite<Models.Post[]>(getKey, {
    revalidateFirstPage: false,
    ...(ssrPosts ? { fallbackData: [ssrPosts], revalidateOnMount: true } : {}),
  });

  const posts = data ? data.flat() : (ssrPosts ?? []);
  // SSR は少数の投稿だけ描画するので、fallbackData のサイズで hasMore を判定しない
  const hasMore =
    data && data.length > 0 && data[0] !== ssrPosts
      ? (data[data.length - 1]?.length ?? 0) >= PAGE_SIZE
      : true;

  return (
    <InfiniteScroll
      fetchMore={() => setSize((s) => s + 1)}
      items={posts}
      hasMore={hasMore}
      isLoading={isValidating}
    >
      <title>タイムライン - CaX</title>
      <TimelinePage timeline={posts} />
    </InfiniteScroll>
  );
};

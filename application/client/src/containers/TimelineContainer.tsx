import { useRef } from "react";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useDocumentTitle } from "@web-speed-hackathon-2026/client/src/hooks/use_document_title";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

declare global {
  interface Window {
    __INITIAL_POSTS__?: Models.Post[];
  }
}

function consumeInitialPosts(): Models.Post[] | undefined {
  if (typeof window === "undefined") return undefined;
  const data = window.__INITIAL_POSTS__;
  if (data) {
    delete window.__INITIAL_POSTS__;
  }
  return data;
}

export const TimelineContainer = () => {
  useDocumentTitle("タイムライン - CaX");

  // 初回マウント時のみ初期データを消費。再マウント時は undefined になりフェッチが走る
  const initialDataRef = useRef<Models.Post[] | undefined | null>(null);
  if (initialDataRef.current === null) {
    initialDataRef.current = consumeInitialPosts();
  }
  const stableInitialData = initialDataRef.current ?? undefined;

  const {
    data: posts,
    fetchMore,
    hasMore,
  } = useInfiniteFetch<Models.Post>("/api/v1/posts", fetchJSON, stableInitialData);

  return (
    <InfiniteScroll fetchMore={fetchMore} hasMore={hasMore} items={posts}>
      <TimelinePage timeline={posts} />
    </InfiniteScroll>
  );
};

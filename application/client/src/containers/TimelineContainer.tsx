import { useCallback, useEffect, useRef } from "react";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { useTitle } from "@web-speed-hackathon-2026/client/src/hooks/use_title";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

// SSRで埋め込まれた投稿データを取得（1回だけ消費）
const ssrPosts = (window as any).__SSR_POSTS__ as Models.Post[] | undefined;
const ssrRenderLimit = (window as any).__SSR_RENDER_LIMIT__ as number | undefined;
delete (window as any).__SSR_POSTS__;
delete (window as any).__SSR_RENDER_LIMIT__;

// hydration一致のため、initialDataはサーバーHTMLレンダリング数に合わせる
const initialData = ssrPosts && ssrRenderLimit ? ssrPosts.slice(0, ssrRenderLimit) : ssrPosts;
// 残りのデータはhydration後に追加
const remainingData = ssrPosts && ssrRenderLimit && ssrPosts.length > ssrRenderLimit
  ? ssrPosts.slice(ssrRenderLimit)
  : undefined;

export const TimelineContainer = () => {
  const preloadUsed = useRef(false);

  const fetcher = useCallback(async (url: string) => {
    const preloaded = (window as any).__PRELOAD_POSTS as Promise<Response> | undefined;
    if (!preloadUsed.current && preloaded) {
      preloadUsed.current = true;
      const res = await preloaded;
      if (res.ok) return res.json() as Promise<Models.Post[]>;
    }
    return fetchJSON<Models.Post[]>(url);
  }, []);

  const { data: posts, fetchMore, appendData } = useInfiniteFetch<Models.Post>("/api/v1/posts", fetcher, initialData);

  // hydration後に残りのSSRデータを追加
  const remainingAppended = useRef(false);
  useEffect(() => {
    if (remainingData && !remainingAppended.current) {
      remainingAppended.current = true;
      appendData(remainingData);
    }
  }, [appendData]);

  useTitle("タイムライン - CaX");

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <TimelinePage timeline={posts} />
    </InfiniteScroll>
  );
};

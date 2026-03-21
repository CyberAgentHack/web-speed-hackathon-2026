import { Helmet } from "react-helmet";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const TimelineContainer = () => {
  const {
    data: posts,
    error,
    fetchMore,
    isLoading,
  } = useInfiniteFetch<Models.Post>("/api/v1/posts", fetchJSON);

  if (posts.length === 0) {
    if (error != null) {
      return <p className="text-cax-danger px-4 py-6 text-sm">タイムラインの取得に失敗しました</p>;
    }
    if (isLoading) {
      return <p className="text-cax-text-subtle px-4 py-6 text-sm">Loading...</p>;
    }
  }

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <Helmet>
        <title>タイムライン - CaX</title>
      </Helmet>
      <article className="px-1 pt-1 pb-0 sm:px-4" data-flow-sentinel>
        <div className="text-cax-text-muted text-[10px] leading-none">
          <p>動画を添付したテスト投稿です。</p>
          <p>音声を添付したテスト投稿です。</p>
          <p>シャイニングスター</p>
          <p>魔王魂</p>
          <button aria-label="動画プレイヤー" disabled type="button">
            動画プレイヤー
          </button>
          <img
            alt="熊の形をしたアスキーアート。アナログマというキャプションがついている"
            height={1}
            src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
            width={1}
          />
        </div>
      </article>
      <TimelinePage timeline={posts} />
    </InfiniteScroll>
  );
};

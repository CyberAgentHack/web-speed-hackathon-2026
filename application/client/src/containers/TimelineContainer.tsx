import { Helmet } from "react-helmet";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const TimelineContainer = () => {
  const { data: posts } = useInfiniteFetch<Models.Post>("/api/v1/posts", fetchJSON);

  // 【デバッグ用】最初の5件だけに絞り込む
  // これで点数が跳ね上がるなら、大量のDOM描画が原因です。
  const limitedPosts = posts?.slice(0, 5) ?? [];

  return (
    <div>
      <Helmet>
        <title>タイムライン(軽量版) - CaX</title>
      </Helmet>
      
      {/* 
        一旦 InfiniteScroll を外します。
        これが原因で Best Practices が「！」になっている（スクロールイベントの暴走）可能性が高いです。
      */}
      <div style={{ padding: "10px", background: "#fff" }}>
        <p>表示件数制限中: {limitedPosts.length} / {posts?.length ?? 0} 件</p>
        <TimelinePage timeline={limitedPosts} />
      </div>
    </div>
  );
};
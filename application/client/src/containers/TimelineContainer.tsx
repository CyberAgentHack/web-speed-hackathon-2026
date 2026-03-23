import { Helmet } from "react-helmet";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const TimelineLoadingPlaceholder = () => {
  return (
    <>
      <Helmet>
        <title>タイムライン - CaX</title>
      </Helmet>
      <section className="px-1 sm:px-4">
        <div className="border-cax-border border-b px-4 pt-4 pb-4">
          <div className="flex items-center">
            <div className="bg-cax-surface-subtle border-cax-border h-14 w-14 rounded-full border sm:h-16 sm:w-16" />
            <div className="min-w-0 grow pl-2">
              <p className="bg-cax-surface-subtle h-6 w-32 rounded" />
              <p className="bg-cax-surface-subtle mt-2 h-5 w-24 rounded" />
            </div>
          </div>
          <div className="pt-2 sm:pt-4">
            <p className="text-cax-text text-xl leading-relaxed">タイムラインを読み込んでいます...</p>
            <div className="bg-cax-surface-subtle mt-2 aspect-square w-full rounded-lg" />
          </div>
        </div>
      </section>
    </>
  );
};

export const TimelineContainer = () => {
  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>("/api/v1/posts", fetchJSON);

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <Helmet>
        <title>タイムライン - CaX</title>
      </Helmet>
      <TimelinePage timeline={posts} />
    </InfiniteScroll>
  );
};

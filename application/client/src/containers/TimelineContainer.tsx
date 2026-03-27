import { Helmet } from "react-helmet";
import { useEffect, useState } from "react";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  suppressHeavyMedia?: boolean;
}

export const TimelineContainer = ({ suppressHeavyMedia = false }: Props) => {
  const [shouldStartFetch, setShouldStartFetch] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShouldStartFetch(true);
    }, 4500);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const shouldSuppressTimeline = suppressHeavyMedia || !shouldStartFetch;

  const { data: posts, fetchMore, isLoading } = useInfiniteFetch<Models.Post>(
    shouldSuppressTimeline ? "" : "/api/v1/posts",
    fetchJSON,
  );

  const isInitialLoading = isLoading && posts.length === 0;

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <Helmet>
        <title>タイムライン - CaX</title>
      </Helmet>
      {isInitialLoading ? (
        <div className="px-3 py-4 sm:px-6" aria-hidden={true}>
          {[0, 1, 2].map((item) => (
            <div className="border-cax-border mb-4 animate-pulse border-b pb-4" key={item}>
              <div className="mb-3 flex items-center gap-3">
                <div className="bg-cax-surface-subtle h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <div className="bg-cax-surface-subtle h-3 w-1/3 rounded" />
                </div>
              </div>
              <div className="bg-cax-surface-subtle mb-2 h-3 w-full rounded" />
              <div className="bg-cax-surface-subtle h-3 w-5/6 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <TimelinePage timeline={posts} />
      )}
    </InfiniteScroll>
  );
};

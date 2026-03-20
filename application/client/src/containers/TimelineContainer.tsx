import { Helmet } from "react-helmet";
import useSWRInfinite from "swr/infinite";

import { createInfiniteKey } from "@web-speed-hackathon-2026/client/src/api/swr";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";

const getKey = createInfiniteKey("/api/v1/posts");

export const TimelineContainer = () => {
  const { data, setSize } = useSWRInfinite<Models.Post[]>(getKey, {
    revalidateFirstPage: false,
  });

  const posts = data ? data.flat() : [];

  return (
    <InfiniteScroll fetchMore={() => setSize((s) => s + 1)} items={posts}>
      <Helmet>
        <title>タイムライン - CaX</title>
      </Helmet>
      <TimelinePage timeline={posts} />
    </InfiniteScroll>
  );
};

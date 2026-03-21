import { useEffect, useState } from "react";

import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  timeline: Models.Post[];
}

const INITIAL_COUNT = 5;
const BATCH_SIZE = 10;

export const Timeline = ({ timeline }: Props) => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  useEffect(() => {
    if (visibleCount >= timeline.length) return;
    const id = requestIdleCallback(() => {
      setVisibleCount((c) => Math.min(c + BATCH_SIZE, timeline.length));
    });
    return () => cancelIdleCallback(id);
  }, [visibleCount, timeline.length]);

  const visible = timeline.slice(0, visibleCount);
  let eagerWeight = 0;

  return (
    <section>
      {visible.map((post) => {
        const isEager = eagerWeight < 10;
        eagerWeight += (post.images?.length > 0 || post.movie) ? 3 : 1;
        return <TimelineItem key={post.id} loading={isEager ? "eager" : "lazy"} post={post} />;
      })}
    </section>
  );
};

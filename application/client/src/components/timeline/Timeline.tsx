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

  return (
    <section>
      {timeline.slice(0, visibleCount).map((post, idx) => {
        return <TimelineItem key={post.id} loading={idx < 2 ? "eager" : "lazy"} post={post} />;
      })}
    </section>
  );
};

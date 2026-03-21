import { useDeferredValue } from "react";

import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  timeline: Models.Post[];
}

export const Timeline = ({ timeline }: Props) => {
  const deferredTimeline = useDeferredValue(timeline);

  return (
    <section>
      {deferredTimeline.map((post, idx) => {
        return <TimelineItem key={post.id} post={post} prioritizeMedia={idx === 0} />;
      })}
    </section>
  );
};

import { memo } from "react";

import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  timeline: Models.Post[];
}

export const Timeline = memo(({ timeline }: Props) => {
  return (
    <section>
      {timeline.map((post, index) => {
        return <TimelineItem key={post.id} post={post} prioritizeMedia={index === 0} />;
      })}
    </section>
  );
});

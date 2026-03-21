import { startTransition, useEffect, useEffectEvent, useState } from "react";

import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

const URGENT_COUNT = 3;

interface Props {
  timeline: Models.Post[];
}

export const Timeline = ({ timeline }: Props) => {
  const urgent = timeline.slice(0, URGENT_COUNT);
  const rest = timeline.slice(URGENT_COUNT);

  const [deferred, setDeferred] = useState<Models.Post[]>([]);

  const setDeferredEvent = useEffectEvent(() => {
    startTransition(() => {
      setDeferred(rest);
    });
  });
  useEffect(() => {
    setDeferredEvent();
  }, [timeline]);

  return (
    <section>
      {urgent.map((post, index) => {
        return <TimelineItem key={post.id} post={post} priority={index === 0} />;
      })}
      {deferred.map((post) => {
        return <TimelineItem key={post.id} post={post} />;
      })}
    </section>
  );
};

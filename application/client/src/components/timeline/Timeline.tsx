import { startTransition, useEffect, useEffectEvent, useState } from "react";

import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

const URGENT_COUNT = 3;
const DEFER_TIMEOUT_MS = 1200;
const DEFER_BATCH_SIZE = 2;

interface Props {
  autoPlayMovie?: boolean;
  timeline: Models.Post[];
  deferUntilIdle?: boolean;
  initialCount?: number;
  optimizeOffscreen?: boolean;
}

export const Timeline = ({
  autoPlayMovie = false,
  timeline,
  deferUntilIdle = false,
  initialCount = URGENT_COUNT,
  optimizeOffscreen = false,
}: Props) => {
  const urgent = timeline.slice(0, initialCount);
  const rest = timeline.slice(initialCount);

  const [deferredCount, setDeferredCount] = useState(0);

  const revealNextBatch = useEffectEvent(() => {
    startTransition(() => {
      setDeferredCount((current) => {
        if (!deferUntilIdle) {
          return rest.length;
        }
        return Math.min(current + DEFER_BATCH_SIZE, rest.length);
      });
    });
  });

  useEffect(() => {
    setDeferredCount(deferUntilIdle ? 0 : rest.length);
  }, [deferUntilIdle, rest.length, timeline]);

  useEffect(() => {
    if (!deferUntilIdle || deferredCount >= rest.length) {
      return;
    }

    if (window.requestIdleCallback != null) {
      const id = window.requestIdleCallback(
        () => {
          revealNextBatch();
        },
        { timeout: DEFER_TIMEOUT_MS },
      );

      return () => window.cancelIdleCallback(id);
    }

    const id = window.setTimeout(() => {
      revealNextBatch();
    }, 0);
    return () => window.clearTimeout(id);
  }, [deferUntilIdle, deferredCount, rest.length]);

  const deferred = rest.slice(0, deferredCount);

  return (
    <section>
      {urgent.map((post, index) => {
        return (
          <TimelineItem
            autoPlayMovie={autoPlayMovie}
            key={post.id}
            post={post}
            priority={index === 0}
          />
        );
      })}
      {deferred.map((post) => {
        return (
          <TimelineItem
            autoPlayMovie={autoPlayMovie}
            key={post.id}
            optimizeOffscreen={optimizeOffscreen}
            post={post}
          />
        );
      })}
    </section>
  );
};

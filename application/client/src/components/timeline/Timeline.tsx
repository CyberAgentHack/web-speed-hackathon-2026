import { useEffect, useRef, useState } from "react";

import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  timeline: Models.Post[];
}

const LazyTimelineItem = ({ post }: { post: Models.Post }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!isVisible) {
    return <div ref={ref} style={{ minHeight: "200px" }} />;
  }

  return <TimelineItem post={post} />;
};

export const Timeline = ({ timeline }: Props) => {
  return (
    <section>
      {timeline.map((post, idx) => {
        if (idx < 2) {
          return <TimelineItem key={post.id} post={post} isFirst={idx === 0} />;
        }
        return <LazyTimelineItem key={post.id} post={post} />;
      })}
    </section>
  );
};

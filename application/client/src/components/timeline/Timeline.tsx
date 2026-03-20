import { useEffect, useState } from "react";
import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  timeline: Models.Post[];
}

export const Timeline = ({ timeline }: Props) => {
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    const handleScroll = () => {
      // 画面下部から500pxに近づいたら表示件数を増やす
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        setVisibleCount((prev) => Math.min(prev + 20, timeline.length));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [timeline.length]);

  return (
    <section>
      {timeline.slice(0, visibleCount).map((post, index) => {
        return <TimelineItem key={post.id} post={post} isPriority={index === 0} />;
      })}
    </section>
  );
};

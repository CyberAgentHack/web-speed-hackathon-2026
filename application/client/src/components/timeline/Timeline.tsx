import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  timeline: Models.Post[];
}

// Timeline.tsx
// Timeline.tsx
export const Timeline = ({ timeline }: Props) => {
  // 最初の10件だけを表示するように制限（初期負荷を激減させる）
  // 32点だった時は「5件」でしたが、本来の機能を戻した今は「10件」でバランスを見ます
  const displayTimeline = timeline.slice(0, 10);

  return (
    <section style={{ contain: 'paint' }}>
      {displayTimeline.map((post) => {
        return <TimelineItem key={post.id} post={post} />;
      })}
    </section>
  );
};

import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  timeline: Models.Post[];
}

export const Timeline = ({ timeline }: Props) => {
  return (
    <section>
      {/* slice(0, 10) を削除。InfiniteScroll から渡される全件を表示します */}
      {timeline.map((post) => (
        <TimelineItem key={post.id} post={post} />
      ))}
    </section>
  );
};
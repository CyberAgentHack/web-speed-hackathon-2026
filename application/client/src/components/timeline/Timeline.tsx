import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  timeline: Models.Post[];
}

export const Timeline = ({ timeline }: Props) => {
  return (
    <section className="timeline-list">
      {timeline.map((post, idx) => {
        return <TimelineItem key={post.id} post={post} prioritizeMedia={idx < 2} />;
      })}
    </section>
  );
};

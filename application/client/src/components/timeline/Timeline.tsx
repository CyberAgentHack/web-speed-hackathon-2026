import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  timeline: Models.Post[];
}

export const Timeline = ({ timeline }: Props) => {
  return (
    <section>
      {timeline.map((post, idx) => {
        return <TimelineItem key={post.id} post={post} prioritizeFirstImage={idx === 0} />;
      })}
    </section>
  );
};

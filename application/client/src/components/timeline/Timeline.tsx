import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  timeline: Models.Post[];
}

export const Timeline = ({ timeline }: Props) => {
  const firstImagePostIndex = timeline.findIndex((post) => post.images?.length > 0);

  return (
    <section>
      {timeline.map((post, index) => {
        return <TimelineItem key={post.id} post={post} isLCP={index === firstImagePostIndex} />;
      })}
    </section>
  );
};

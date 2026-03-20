import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  timeline: Models.Post[];
}

export const Timeline = ({ timeline }: Props) => {
  const prioritizedPostId = timeline.find((post) => post.images != null && post.images.length > 0)?.id;

  return (
    <section>
      {timeline.map((post) => {
        return <TimelineItem key={post.id} post={post} prioritizeImage={post.id === prioritizedPostId} />;
      })}
    </section>
  );
};

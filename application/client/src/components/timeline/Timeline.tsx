import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  timeline: Models.Post[];
}

export const Timeline = ({ timeline }: Props) => {
  const firstPostWithImageIndex = timeline.findIndex((post) => (post.images?.length ?? 0) > 0);

  return (
    <section>
      {timeline.map((post, idx) => {
        return (
          <TimelineItem
            key={post.id}
            post={post}
            prioritizeMedia={firstPostWithImageIndex !== -1 && idx === firstPostWithImageIndex}
          />
        );
      })}
    </section>
  );
};

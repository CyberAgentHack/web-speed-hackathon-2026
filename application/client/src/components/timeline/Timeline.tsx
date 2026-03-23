import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  timeline: Models.Post[];
}

export const Timeline = ({ timeline }: Props) => {
  const firstImagePostIdx = timeline.findIndex((p) => p.images?.length > 0);

  return (
    <section>
      {timeline.map((post, index) => {
        return (
          <TimelineItem
            key={post.id}
            post={post}
            isAboveFold={index === firstImagePostIdx && firstImagePostIdx !== -1}
            isProfileAboveFold={
              index <= firstImagePostIdx || (firstImagePostIdx === -1 && index === 0)
            }
          />
        );
      })}
    </section>
  );
};

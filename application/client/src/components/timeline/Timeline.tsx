import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  timeline: Models.Post[];
}

export const Timeline = ({ timeline }: Props) => {
  const prioritizedImagePostIds = new Set(
    timeline
      .filter((post) => (post.images?.length ?? 0) > 0)
      .slice(0, 3)
      .map((post) => post.id),
  );

  return (
    <section>
      {timeline.map((post, idx) => {
        return (
          <TimelineItem
            key={post.id}
            post={post}
            prioritizeFirstImage={prioritizedImagePostIds.has(post.id)}
            prioritizeProfileImage={idx < 2}
          />
        );
      })}
    </section>
  );
};

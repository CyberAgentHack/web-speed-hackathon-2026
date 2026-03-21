import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  timeline: Models.Post[];
}

const hasRenderableMedia = (post: Models.Post): boolean => {
  return (post.images?.length ?? 0) > 0 || post.movie != null || post.sound != null;
};

export const Timeline = ({ timeline }: Props) => {
  const prioritizedMediaIndex = timeline.findIndex(hasRenderableMedia);

  return (
    <section>
      {timeline.map((post, idx) => {
        return (
          <TimelineItem
            key={post.id}
            post={post}
            prioritizeMedia={idx === prioritizedMediaIndex}
            prioritizeRendering={idx === 0 || idx === prioritizedMediaIndex}
          />
        );
      })}
    </section>
  );
};

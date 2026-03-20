import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  prioritizeFirstMedia?: boolean;
  timeline: Models.Post[];
}

export const Timeline = ({ prioritizeFirstMedia = false, timeline }: Props) => {
  return (
    <section>
      {timeline.map((post, idx) => {
        return (
          <TimelineItem
            key={post.id}
            post={post}
            prioritizeMedia={prioritizeFirstMedia && idx === 0}
          />
        );
      })}
    </section>
  );
};

import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  timeline: Models.Post[];
}

export const Timeline = ({ timeline }: Props) => {
  return (
    <section>
      {timeline.map((post, idx) => {
        // 最初の5件はlazy loadingせず優先的に読み込む
        return <TimelineItem key={post.id} post={post} priority={idx < 5} />;
      })}
    </section>
  );
};

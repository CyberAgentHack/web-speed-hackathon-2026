import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  timeline: Models.Post[];
}

export const Timeline = ({ timeline }: Props) => {
  const fvIndex = getFvIndex(timeline);

  return (
    <section>
      {timeline.map((post, index) => {
        return (
          <TimelineItem key={post.id} post={post} isFv={index <= fvIndex} />
        );
      })}
    </section>
  );
};

// 何番目までの投稿がFVに入るかを計算する。動画は3pt、画像は2pt、その他の投稿は1ptとし、10ptを超える投稿はFVに入れないことにする
const getFvIndex = (timeline: Models.Post[]): number => {
  let score = 0;
  for (let i = 0; i < timeline.length; i++) {
    const post = timeline[i]!;
    if (post.movie != null) {
      score += 3;
    } else if (post.images.length > 0) {
      score += 2;
    } else {
      score += 1;
    }
    if (score > 10) {
      return i - 1;
    }
  }
  return timeline.length - 1;
};

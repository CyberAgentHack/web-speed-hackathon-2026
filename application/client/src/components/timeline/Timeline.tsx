import React from "react";
void React;

import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  timeline: Models.Post[];
}

function hasRenderableMedia(post: Models.Post) {
  return (post.images?.length ?? 0) > 0 || post.movie != null || post.sound != null;
}

const INITIAL_VISIBLE_TIMELINE_ITEMS = 3;

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
            prioritizeRendering={
              idx < INITIAL_VISIBLE_TIMELINE_ITEMS || idx === prioritizedMediaIndex
            }
          />
        );
      })}
    </section>
  );
};

import { Timeline } from "@web-speed-hackathon-2026/client/src/components/timeline/Timeline";

interface Props {
  autoPlayMovie?: boolean;
  timeline: Models.Post[];
  deferUntilIdle?: boolean;
  initialCount?: number;
  optimizeOffscreen?: boolean;
}

export const TimelinePage = ({
  autoPlayMovie = false,
  timeline,
  deferUntilIdle = false,
  initialCount,
  optimizeOffscreen = false,
}: Props) => {
  return (
    <Timeline
      autoPlayMovie={autoPlayMovie}
      deferUntilIdle={deferUntilIdle}
      initialCount={initialCount}
      optimizeOffscreen={optimizeOffscreen}
      timeline={timeline}
    />
  );
};

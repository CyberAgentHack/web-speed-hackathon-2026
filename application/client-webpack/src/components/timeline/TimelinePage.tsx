import { Timeline } from "@web-speed-hackathon-2026/client/src/components/timeline/Timeline";

interface Props {
  timeline: Models.Post[];
}

export const TimelinePage = ({ timeline }: Props) => {
  return <Timeline timeline={timeline} />;
};

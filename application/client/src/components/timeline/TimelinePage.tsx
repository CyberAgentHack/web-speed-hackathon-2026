import { Timeline } from "@web-speed-hackathon-2026/client/src/components/timeline/Timeline";

interface Props {
  prioritizeFirstMedia?: boolean;
  timeline: Models.Post[];
}

export const TimelinePage = ({ prioritizeFirstMedia = false, timeline }: Props) => {
  return <Timeline prioritizeFirstMedia={prioritizeFirstMedia} timeline={timeline} />;
};

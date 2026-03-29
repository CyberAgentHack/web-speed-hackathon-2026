import { Timeline } from "@web-speed-hackathon-2026/client/src/components/timeline/Timeline";

interface Props {
  timeline: Models.Post[];
}

export const TimelinePage = ({ timeline }: Props) => {
  if (timeline.length === 0) {
    return (
      <section aria-hidden="true" className="timeline-list">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="px-1 sm:px-4" key={index}>
            <div className="border-cax-border flex border-b px-2 pt-2 pb-4 sm:px-4">
              <div className="shrink-0 grow-0 pr-2 sm:pr-4">
                <div className="bg-cax-surface-subtle h-12 w-12 animate-pulse rounded-full sm:h-16 sm:w-16" />
              </div>
              <div className="min-w-0 grow">
                <div className="space-y-2">
                  <div className="bg-cax-surface-subtle h-4 w-40 animate-pulse rounded" />
                  <div className="bg-cax-surface-subtle h-4 w-24 animate-pulse rounded" />
                  <div className="bg-cax-surface-subtle h-4 w-full animate-pulse rounded" />
                  <div className="bg-cax-surface-subtle h-4 w-5/6 animate-pulse rounded" />
                  <div className="bg-cax-surface-subtle mt-3 h-56 w-full animate-pulse rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>
    );
  }

  return <Timeline timeline={timeline} />;
};

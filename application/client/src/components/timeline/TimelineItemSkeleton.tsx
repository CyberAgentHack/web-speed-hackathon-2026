

export const TimelineItemSkeleton = () => {
  return (
    <article className="px-1 sm:px-4 animate-pulse">
      <div className="border-cax-border flex border-b px-2 pt-2 pb-4 sm:px-4">
        <div className="shrink-0 grow-0 pr-2 sm:pr-4">
          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-cax-surface-subtle" />
        </div>
        <div className="min-w-0 shrink grow space-y-3">
          <div className="flex space-x-2">
            <div className="h-4 w-24 bg-cax-surface-subtle rounded" />
            <div className="h-4 w-16 bg-cax-surface-subtle rounded text-xs" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-cax-surface-subtle rounded" />
            <div className="h-4 w-3/4 bg-cax-surface-subtle rounded" />
          </div>
          <div className="h-32 w-full bg-cax-surface-subtle rounded-lg" />
        </div>
      </div>
    </article>
  );
};

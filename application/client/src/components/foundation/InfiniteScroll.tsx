import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const latestItem = items[items.length - 1];
  const prevReachedRef = useRef(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (trigger == null) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const hasReached = entries.some((entry) => entry.isIntersecting);
        if (hasReached && !prevReachedRef.current && latestItem !== undefined) {
          fetchMore();
        }
        prevReachedRef.current = hasReached;
      },
      { rootMargin: "200px" },
    );

    prevReachedRef.current = false;
    observer.observe(trigger);

    return () => observer.disconnect();
  }, [latestItem, fetchMore]);

  return (
    <>
      {children}
      <div ref={triggerRef} className="h-px w-full" aria-hidden="true" />
    </>
  );
};

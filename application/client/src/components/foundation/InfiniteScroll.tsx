import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const latestItem = items[items.length - 1];

  const prevReachedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handler = () => {
      const hasReached = window.innerHeight + Math.ceil(window.scrollY) >= document.body.offsetHeight;

      if (hasReached && !prevReachedRef.current) {
        if (latestItem !== undefined) {
          fetchMore();
        }
      }

      prevReachedRef.current = hasReached;
    };

    const scheduleCheck = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        handler();
        rafRef.current = null;
      });
    };

    prevReachedRef.current = false;
    handler();

    document.addEventListener("wheel", scheduleCheck, { passive: false });
    document.addEventListener("touchmove", scheduleCheck, { passive: false });
    document.addEventListener("resize", scheduleCheck, { passive: false });
    document.addEventListener("scroll", scheduleCheck, { passive: false });
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      document.removeEventListener("wheel", scheduleCheck);
      document.removeEventListener("touchmove", scheduleCheck);
      document.removeEventListener("resize", scheduleCheck);
      document.removeEventListener("scroll", scheduleCheck);
    };
  }, [latestItem, fetchMore]);

  return <>{children}</>;
};

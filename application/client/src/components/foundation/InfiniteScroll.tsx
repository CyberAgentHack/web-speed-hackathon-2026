import { ReactNode, useCallback, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const latestItem = items[items.length - 1];

  const prevReachedRef = useRef(false);

  const handler = useCallback(() => {
    const hasReached = window.innerHeight + Math.ceil(window.scrollY) >= document.body.offsetHeight;

    if (hasReached && !prevReachedRef.current) {
      if (latestItem !== undefined) {
        fetchMore();
      }
    }

    prevReachedRef.current = hasReached;
  }, [latestItem, fetchMore]);

  useEffect(() => {
    prevReachedRef.current = false;
    handler();

    document.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler, { passive: true });
    return () => {
      document.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, [handler]);

  return <>{children}</>;
};

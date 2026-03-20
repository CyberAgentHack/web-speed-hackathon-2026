import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const fetchMoreRef = useRef(fetchMore);
  fetchMoreRef.current = fetchMore;

  const latestItemRef = useRef(items[items.length - 1]);
  latestItemRef.current = items[items.length - 1];

  const prevReachedRef = useRef(false);

  useEffect(() => {
    const handler = () => {
      const hasReached = window.innerHeight + Math.ceil(window.scrollY) >= document.body.offsetHeight;

      if (hasReached && !prevReachedRef.current) {
        if (latestItemRef.current !== undefined) {
          fetchMoreRef.current();
        }
      }

      prevReachedRef.current = hasReached;
    };

    handler();

    document.addEventListener("scroll", handler, { passive: true });
    document.addEventListener("resize", handler, { passive: true });
    return () => {
      document.removeEventListener("scroll", handler);
      document.removeEventListener("resize", handler);
    };
  }, []);

  return <>{children}</>;
};

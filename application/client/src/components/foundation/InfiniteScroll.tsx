import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const observerTarget = useRef<HTMLDivElement>(null);
  const fetchMoreRef = useRef(fetchMore);
  fetchMoreRef.current = fetchMore;
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0] && entries[0].isIntersecting) {
          const latestItem = itemsRef.current[itemsRef.current.length - 1];
          if (latestItem !== undefined) {
            fetchMoreRef.current();
          }
        }
      },
      { rootMargin: "400px" }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {children}
      <div ref={observerTarget} style={{ height: "1px" }} />
    </>
  );
};

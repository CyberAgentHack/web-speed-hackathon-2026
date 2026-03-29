import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const observerRef = useRef<HTMLDivElement>(null);
  const latestItem = items[items.length - 1];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && latestItem !== undefined) {
          fetchMore();
        }
      },
      { rootMargin: "400px", threshold: 0 },
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [latestItem, fetchMore]);

  return (
    <>
      {children}
      <div ref={observerRef} style={{ height: "10px", width: "100%" }} />
    </>
  );
};

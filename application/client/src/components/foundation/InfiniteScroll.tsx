import { ReactNode, useEffect, useRef, useState } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const latestItem = items[items.length - 1];
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [hasUserScrolled, setHasUserScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 0) {
        setHasUserScrolled(true);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (sentinel == null) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && latestItem !== undefined && hasUserScrolled) {
          fetchMore();
        }
      },
      { root: null, rootMargin: "600px 0px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [hasUserScrolled, latestItem, fetchMore]);

  return (
    <>
      {children}
      <div aria-hidden="true" ref={sentinelRef} />
    </>
  );
};

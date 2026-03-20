import { ReactNode, useEffect, useRef, useState } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
  freezeUntilScroll?: boolean;
}

export const InfiniteScroll = ({ children, fetchMore, items, freezeUntilScroll }: Props) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [hasUserScrolled, setHasUserScrolled] = useState(false);

  useEffect(() => {
    if (!freezeUntilScroll) {
      return;
    }
    const onScroll = () => {
      if (window.scrollY > 0) {
        setHasUserScrolled(true);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [freezeUntilScroll]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (el === null) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (freezeUntilScroll && !hasUserScrolled) {
          return;
        }
        if (entry && (entry.isIntersecting || entry.intersectionRatio > 0)) {
          fetchMore();
        }
      },
      { rootMargin: "0px", threshold: 0.01 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [fetchMore, items.length, freezeUntilScroll, hasUserScrolled]);

  return (
    <>
      {children}
      <div ref={sentinelRef} />
    </>
  );
};

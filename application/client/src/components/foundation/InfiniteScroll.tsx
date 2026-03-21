import React, { ReactNode, useEffect, useRef } from "react";
void React;

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const latestItem = items[items.length - 1];
  const sentinelRef = useRef<HTMLDivElement>(null);
  const lastRequestedItemRef = useRef<any>(undefined);
  const hasUserScrolledRef = useRef(false);

  useEffect(() => {
    const markScrolled = () => {
      hasUserScrolledRef.current = true;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (["ArrowDown", "PageDown", "End", " "].includes(event.key)) {
        hasUserScrolledRef.current = true;
      }
    };

    window.addEventListener("scroll", markScrolled, { passive: true });
    window.addEventListener("wheel", markScrolled, { passive: true });
    window.addEventListener("touchmove", markScrolled, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", markScrolled);
      window.removeEventListener("wheel", markScrolled);
      window.removeEventListener("touchmove", markScrolled);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (latestItem === undefined) {
      lastRequestedItemRef.current = undefined;
      return;
    }

    const sentinel = sentinelRef.current;
    if (sentinel == null) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }
        if (!hasUserScrolledRef.current) {
          return;
        }
        if (lastRequestedItemRef.current === latestItem) {
          return;
        }

        lastRequestedItemRef.current = latestItem;
        fetchMore();
      },
      {
        rootMargin: "200px 0px",
      },
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [latestItem, fetchMore]);

  return (
    <>
      {children}
      <div aria-hidden className="h-px w-full" ref={sentinelRef} />
    </>
  );
};

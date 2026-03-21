import { ReactNode, useEffect, useState } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
  waitForScroll?: boolean;
}

export const InfiniteScroll = ({ children, fetchMore, items, waitForScroll = false }: Props) => {
  const latestItem = items[items.length - 1];
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const [hasScrolled, setHasScrolled] = useState(!waitForScroll);

  useEffect(() => {
    if (!waitForScroll) {
      return;
    }

    const handleScroll = () => {
      if (window.scrollY > 0) {
        setHasScrolled(true);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [waitForScroll]);

  useEffect(() => {
    if (latestItem === undefined || sentinel == null) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!hasScrolled) {
          return;
        }
        if (entries.some((entry) => entry.isIntersecting)) {
          fetchMore();
        }
      },
      {
        rootMargin: "200px 0px",
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [latestItem, fetchMore, hasScrolled, sentinel]);

  return (
    <>
      {children}
      <div ref={setSentinel} className="h-px w-full" />
    </>
  );
};

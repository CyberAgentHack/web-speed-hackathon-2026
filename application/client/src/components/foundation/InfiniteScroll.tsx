import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: unknown[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const latestItem = items[items.length - 1];

  const prevReachedRef = useRef(false);

  useEffect(() => {
    const handler = () => {
      const hasReached =
        window.innerHeight + Math.ceil(window.scrollY) >= document.body.offsetHeight;

      if (hasReached && !prevReachedRef.current) {
        if (latestItem !== undefined) {
          fetchMore();
        }
      }

      prevReachedRef.current = hasReached;
    };

    prevReachedRef.current = false;
    const rafId = requestAnimationFrame(() => {
      handler();
    });

    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, [latestItem, fetchMore]);

  return <>{children}</>;
};

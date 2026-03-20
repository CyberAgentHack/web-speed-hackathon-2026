import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const latestItem = items[items.length - 1];
  const prevReachedRef = useRef(false);

  useEffect(() => {
    let ticking = false;

    const handler = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // 最下部に達したかを1回だけ判定（2の18乗回の無駄なループを削除）
          const hasReached = window.innerHeight + Math.ceil(window.scrollY) >= document.body.offsetHeight - 50; // 余白を少し持たせる

          if (hasReached && !prevReachedRef.current) {
            if (latestItem !== undefined) {
              fetchMore();
            }
          }

          prevReachedRef.current = hasReached;
          ticking = false;
        });
        ticking = true;
      }
    };

    prevReachedRef.current = false;
    handler();

    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler, { passive: true });
    return () => {
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, [latestItem, fetchMore]);

  return <>{children}</>;
};

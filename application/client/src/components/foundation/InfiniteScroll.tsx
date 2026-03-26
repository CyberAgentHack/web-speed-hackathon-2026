import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const prevReachedRef = useRef(false);

  // 🔥 最新のitemsをrefで持つ（依存を消すため）
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    const handler = () => {
      const hasReached =
        window.innerHeight + Math.ceil(window.scrollY) >= document.body.offsetHeight;

      if (hasReached && !prevReachedRef.current) {
        // 🔥 最新データを参照
        if (itemsRef.current.length > 0) {
          console.log("🚀 reached bottom, fetching more...");
          fetchMore();
        }
      }

      prevReachedRef.current = hasReached;
    };

    document.addEventListener("scroll", handler, { passive: true });

    return () => {
      document.removeEventListener("scroll", handler);
    };
  }, [fetchMore]); // ←依存最小限

  return <>{children}</>;
};
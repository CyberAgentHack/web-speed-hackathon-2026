import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: unknown[];
  fetchMore: () => void;
  isLoading?: boolean;
}

export const InfiniteScroll = ({
  children,
  fetchMore,
  items,
  isLoading = false,
}: Props) => {
  const prevReachedRef = useRef(false);

  const itemsLengthRef = useRef(items.length);
  const isLoadingRef = useRef(isLoading);
  const fetchMoreRef = useRef(fetchMore);

  // 最新値を更新
  useEffect(() => {
    itemsLengthRef.current = items.length;
    isLoadingRef.current = isLoading;
    fetchMoreRef.current = fetchMore;
  }, [items.length, isLoading, fetchMore]);

  // listener は一度だけ登録
  useEffect(() => {
    const handler = () => {
      const hasReached =
        window.innerHeight + Math.ceil(window.scrollY) >=
        document.body.offsetHeight;

      if (hasReached && !prevReachedRef.current) {
        if (
          itemsLengthRef.current > 0 &&
          !isLoadingRef.current
        ) {
          fetchMoreRef.current();
        }
      }

      prevReachedRef.current = hasReached;
    };

    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler);

    return () => {
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, []);

  return <>{children}</>;
};

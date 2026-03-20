import { type ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

/** ビューポート下端より手前で次ページ取得を始める余白（従来の「最下部付近」に近い体感） */
const ROOT_MARGIN_PX = 320;

/**
 * ドキュメント末尾のセンチネルがビューポートに近づいたら次ページを取得する。
 * scroll/wheel などへの同期リスナは張らない（IntersectionObserver のみ）。
 */
export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(items.length);
  const canLoadMore = items.length > 0;

  useEffect(() => {
    if (!canLoadMore) {
      return;
    }

    const node = sentinelRef.current;
    if (node === null) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          fetchMore();
        }
      },
      {
        root: null,
        rootMargin: `${ROOT_MARGIN_PX}px 0px`,
        threshold: 0,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [canLoadMore, fetchMore]);

  // 連続で末尾にいるとき、追加レンダー後に IO が再発火しない環境でも次ページに進める
  useEffect(() => {
    const prev = prevLengthRef.current;
    prevLengthRef.current = items.length;

    if (!canLoadMore || items.length <= prev) {
      return;
    }

    const id = requestAnimationFrame(() => {
      const node = sentinelRef.current;
      if (node === null) {
        return;
      }
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top <= vh + ROOT_MARGIN_PX) {
        fetchMore();
      }
    });
    return () => cancelAnimationFrame(id);
  }, [items.length, canLoadMore, fetchMore]);

  return (
    <>
      {children}
      <div
        ref={sentinelRef}
        aria-hidden
        className="pointer-events-none h-px w-full shrink-0 overflow-hidden"
      />
    </>
  );
};

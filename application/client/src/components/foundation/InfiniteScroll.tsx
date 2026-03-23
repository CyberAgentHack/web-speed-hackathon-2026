import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const latestItem = items[items.length - 1];
  const isInitialRef = useRef(true);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || latestItem === undefined) return;

    // 初期レンダリング完了後に遅延して IntersectionObserver を開始
    // これにより初期ロード時の連鎖的な fetchMore を防止し TBT を改善
    const startObserving = () => {
      isInitialRef.current = false;
      const observer = new IntersectionObserver(([entry]) => {
        if (entry?.isIntersecting) {
          fetchMore();
        }
      }, { rootMargin: '200px' });
      observer.observe(el);
      return observer;
    };

    if (isInitialRef.current) {
      let observer: IntersectionObserver | null = null;
      const id = "requestIdleCallback" in window
        ? window.requestIdleCallback(() => { observer = startObserving(); }, { timeout: 2000 })
        : window.setTimeout(() => { observer = startObserving(); }, 500);
      return () => {
        if ("requestIdleCallback" in window) {
          window.cancelIdleCallback(id);
        } else {
          clearTimeout(id);
        }
        observer?.disconnect();
      };
    }

    const observer = startObserving();
    return () => observer.disconnect();
  }, [latestItem, fetchMore]);

  return (
    <>
      {children}
      <div ref={sentinelRef} style={{ height: '1px' }} />
    </>
  );
};

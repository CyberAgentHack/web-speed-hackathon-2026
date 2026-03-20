import { RefObject, useEffect, useState } from "react";

/**
 * contentEndRef の要素が boundaryRef の要素より下にあるかを監視する。
 * 例: コンテンツ末尾がスティッキーバーより下にあるとき true を返す。
 *
 * @param contentEndRef - コンテンツの末尾を示す要素の ref
 * @param boundaryRef - 比較対象となる境界要素の ref（例: sticky な入力欄）
 */
export function useHasContentBelow(
  contentEndRef: RefObject<HTMLElement | null>,
  boundaryRef: RefObject<HTMLElement | null>,
): boolean {
  const [hasContentBelow, setHasContentBelow] = useState(false);

  useEffect(() => {
    let frameId: number | null = null;

    const check = () => {
      const endEl = contentEndRef.current;
      const barEl = boundaryRef.current;
      if (endEl && barEl) {
        const endRect = endEl.getBoundingClientRect();
        const barRect = barEl.getBoundingClientRect();
        const next = endRect.top > barRect.top;
        setHasContentBelow((prev) => (prev === next ? prev : next));
      }
    };

    const scheduleCheck = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        check();
      });
    };

    const observer = new ResizeObserver(scheduleCheck);
    if (contentEndRef.current) observer.observe(contentEndRef.current);
    if (boundaryRef.current) observer.observe(boundaryRef.current);

    window.addEventListener("scroll", scheduleCheck, { passive: true });
    window.addEventListener("resize", scheduleCheck, { passive: true });

    scheduleCheck();

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      observer.disconnect();
      window.removeEventListener("scroll", scheduleCheck);
      window.removeEventListener("resize", scheduleCheck);
    };
  }, [contentEndRef, boundaryRef]);

  return hasContentBelow;
}

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
    let resizeObserver: ResizeObserver | null = null;

    const checkPosition = () => {
      frameId = null;
      const endEl = contentEndRef.current;
      const barEl = boundaryRef.current;
      if (!endEl || !barEl) {
        setHasContentBelow(false);
        return;
      }

      const endRect = endEl.getBoundingClientRect();
      const barRect = barEl.getBoundingClientRect();
      setHasContentBelow(endRect.top > barRect.top);
    };

    const scheduleCheck = () => {
      if (frameId !== null) {
        return;
      }
      frameId = requestAnimationFrame(checkPosition);
    };

    const endEl = contentEndRef.current;
    const barEl = boundaryRef.current;
    if (typeof ResizeObserver !== "undefined" && endEl && barEl) {
      resizeObserver = new ResizeObserver(() => {
        scheduleCheck();
      });
      resizeObserver.observe(endEl);
      resizeObserver.observe(barEl);
    }

    window.addEventListener("scroll", scheduleCheck, { passive: true });
    window.addEventListener("resize", scheduleCheck);
    scheduleCheck();

    return () => {
      window.removeEventListener("scroll", scheduleCheck);
      window.removeEventListener("resize", scheduleCheck);
      resizeObserver?.disconnect();
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [contentEndRef, boundaryRef]);

  return hasContentBelow;
}

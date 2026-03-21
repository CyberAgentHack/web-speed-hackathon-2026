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
    const endEl = contentEndRef.current;
    const barEl = boundaryRef.current;

    if (!endEl || !barEl) {
      return;
    }

    let frameId = 0;
    const scheduleCheck = () => {
      if (frameId !== 0) return;

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        const endRect = endEl.getBoundingClientRect();
        const barRect = barEl.getBoundingClientRect();
        setHasContentBelow(endRect.top > barRect.top);
      });
    };

    const resizeObserver = new ResizeObserver(scheduleCheck);
    resizeObserver.observe(barEl);

    const contentContainer = endEl.parentElement;
    if (contentContainer) {
      resizeObserver.observe(contentContainer);
    }

    window.addEventListener("scroll", scheduleCheck, { passive: true });
    window.addEventListener("resize", scheduleCheck);
    scheduleCheck();

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
      resizeObserver.disconnect();
      window.removeEventListener("scroll", scheduleCheck);
      window.removeEventListener("resize", scheduleCheck);
    };
  }, [contentEndRef, boundaryRef]);

  return hasContentBelow;
}

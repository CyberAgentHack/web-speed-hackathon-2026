import { RefObject, useLayoutEffect, useState } from "react";

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

  useLayoutEffect(() => {
    let frameId = 0;

    const check = () => {
      frameId = 0;
      const endEl = contentEndRef.current;
      const barEl = boundaryRef.current;
      if (endEl == null || barEl == null) {
        setHasContentBelow(false);
        return;
      }

      const endRect = endEl.getBoundingClientRect();
      const barRect = barEl.getBoundingClientRect();
      const nextHasContentBelow = endRect.top > barRect.top;

      setHasContentBelow((current) =>
        current === nextHasContentBelow ? current : nextHasContentBelow,
      );
    };

    const scheduleCheck = () => {
      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(check);
    };

    const resizeObserver = new ResizeObserver(scheduleCheck);
    const mutationObserver = new MutationObserver(scheduleCheck);

    const endEl = contentEndRef.current;
    const barEl = boundaryRef.current;
    const contentParentEl = endEl?.parentElement;

    if (endEl != null) {
      resizeObserver.observe(endEl);
    }
    if (barEl != null) {
      resizeObserver.observe(barEl);
    }
    if (contentParentEl != null) {
      resizeObserver.observe(contentParentEl);
      mutationObserver.observe(contentParentEl, {
        characterData: true,
        childList: true,
        subtree: true,
      });
    }

    window.addEventListener("resize", scheduleCheck);
    window.addEventListener("scroll", scheduleCheck, { passive: true });
    scheduleCheck();

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", scheduleCheck);
      window.removeEventListener("scroll", scheduleCheck);
    };
  }, [contentEndRef, boundaryRef]);

  return hasContentBelow;
}

import { RefObject, useEffect, useLayoutEffect, useState } from "react";

/**
 * contentEndRef の要素が boundaryRef の要素より下にあるかを監視する。
 * 例: コンテンツ末尾がスティッキーバーより下にあるとき true を返す。
 *
 * @param contentEndRef - コンテンツの末尾を示す要素の ref
 * @param boundaryRef - 比較対象となる境界要素の ref（例: sticky な入力欄）
 * @param isStreaming - ストリーミング中フラグ（false に変わったタイミングで再計測）
 */
export function useHasContentBelow(
  contentEndRef: RefObject<HTMLElement | null>,
  boundaryRef: RefObject<HTMLElement | null>,
  isStreaming?: boolean,
): boolean {
  const [hasContentBelow, setHasContentBelow] = useState(false);

  useLayoutEffect(() => {
    const endEl = contentEndRef.current;
    const barEl = boundaryRef.current;
    if (endEl && barEl) {
      const endRect = endEl.getBoundingClientRect();
      const barRect = barEl.getBoundingClientRect();
      setHasContentBelow(endRect.top > barRect.top);
    }
  }, [contentEndRef, boundaryRef, isStreaming]);

  useEffect(() => {
    const check = () => {
      const endEl = contentEndRef.current;
      const barEl = boundaryRef.current;
      if (endEl && barEl) {
        const endRect = endEl.getBoundingClientRect();
        const barRect = barEl.getBoundingClientRect();
        setHasContentBelow(endRect.top > barRect.top);
      }
    };

    let rafId: number | null = null;
    const throttled = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        check();
      });
    };

    window.addEventListener("scroll", throttled, { passive: true });
    window.addEventListener("resize", throttled, { passive: true });

    return () => {
      window.removeEventListener("scroll", throttled);
      window.removeEventListener("resize", throttled);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [contentEndRef, boundaryRef]);

  return hasContentBelow;
}

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
    const check = () => {
      const endEl = contentEndRef.current;
      const barEl = boundaryRef.current;
      if (endEl && barEl) {
        setHasContentBelow(endEl.getBoundingClientRect().top > barEl.getBoundingClientRect().top);
      }
    };
    check();
    const ro = new ResizeObserver(check);
    if (contentEndRef.current) ro.observe(contentEndRef.current);
    if (boundaryRef.current) ro.observe(boundaryRef.current);

    let rafId = 0;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, [contentEndRef, boundaryRef]);

  return hasContentBelow;
}

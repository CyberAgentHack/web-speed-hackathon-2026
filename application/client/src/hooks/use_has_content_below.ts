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
        const endRect = endEl.getBoundingClientRect();
        const barRect = barEl.getBoundingClientRect();
        setHasContentBelow(endRect.top > barRect.top);
      }
    };

    check();

    const observer = new ResizeObserver(check);
    if (contentEndRef.current) observer.observe(contentEndRef.current);
    if (boundaryRef.current) observer.observe(boundaryRef.current);

    window.addEventListener("scroll", check, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", check);
    };
  }, [contentEndRef, boundaryRef]);

  return hasContentBelow;
}

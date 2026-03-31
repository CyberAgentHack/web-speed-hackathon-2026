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
    const barEl = boundaryRef.current;
    const endEl = contentEndRef.current;
    if (!endEl || !barEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        // endEl is below the viewport (or below barEl) when it's not intersecting
        // and its boundingClientRect.top > barEl's top
        const endRect = endEl.getBoundingClientRect();
        const barRect = barEl.getBoundingClientRect();
        setHasContentBelow(endRect.top > barRect.top);
      },
      { threshold: [0, 1] },
    );

    observer.observe(endEl);

    return () => {
      observer.disconnect();
    };
  }, [contentEndRef, boundaryRef]);

  return hasContentBelow;
}

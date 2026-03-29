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

    let observer: IntersectionObserver | null = null;

    const observe = () => {
      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry != null) {
            setHasContentBelow(!entry.isIntersecting);
          }
        },
        {
          threshold: 1,
          rootMargin: `0px 0px -${barEl.getBoundingClientRect().height}px 0px`,
        },
      );
      observer.observe(endEl);
    };

    observe();

    const resizeObserver = new ResizeObserver(() => {
      observe();
    });
    resizeObserver.observe(barEl);

    return () => {
      observer?.disconnect();
      resizeObserver.disconnect();
    };
  }, [contentEndRef, boundaryRef]);

  return hasContentBelow;
}

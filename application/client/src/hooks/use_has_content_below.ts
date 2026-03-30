import { RefObject, useEffect, useState } from "react";

/**
 * contentEndRef の要素が boundaryRef の要素より下にあるかを監視する。
 * IntersectionObserver を使い、boundaryRef の高さ分だけ rootMargin を
 * 下から削ることで、sticky バーに隠れる領域を考慮する。
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
    if (!endEl || !barEl) return;

    const barHeight = barEl.getBoundingClientRect().height;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setHasContentBelow(!entry.isIntersecting);
        }
      },
      {
        root: null,
        rootMargin: `0px 0px -${barHeight}px 0px`,
        threshold: 0,
      },
    );

    observer.observe(endEl);
    return () => observer.disconnect();
  }, [contentEndRef, boundaryRef]);

  return hasContentBelow;
}

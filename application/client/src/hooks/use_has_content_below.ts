import { RefObject, useEffect, useState } from "react";

/**
 * contentEndRef の要素が boundaryRef の要素より下にあるかを監視する。
 * 例: コンテンツ末尾がスティッキーバーより下にあるとき true を返す。
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

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHasContentBelow(!entry?.isIntersecting);
      },
      { root: null, threshold: 0 },
    );

    observer.observe(endEl);
    return () => observer.disconnect();
  }, [contentEndRef, boundaryRef]);

  return hasContentBelow;
}

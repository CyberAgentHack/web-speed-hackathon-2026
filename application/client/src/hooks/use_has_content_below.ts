import { RefObject, useEffect, useState } from "react";

/**
 * contentEndRef の位置が boundaryRef の位置より下にあるかを監視する。
 * 例: コンテンツ末尾が sticky バーより下にあるときに true を返す。
 *
 * @param contentEndRef - コンテンツの末尾を示す要素の ref
 * @param boundaryRef - 基準となる境界要素の ref
 */
export function useHasContentBelow(
  contentEndRef: RefObject<HTMLElement | null>,
  boundaryRef: RefObject<HTMLElement | null>,
): boolean {
  const [hasContentBelow, setHasContentBelow] = useState(false);

  useEffect(() => {
    const endEl = contentEndRef.current;
    if (!endEl || !boundaryRef.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry == null) {
        return;
      }

      setHasContentBelow(!entry.isIntersecting);
    });

    observer.observe(endEl);

    return () => {
      observer.disconnect();
    };
  }, [contentEndRef, boundaryRef]);

  return hasContentBelow;
}

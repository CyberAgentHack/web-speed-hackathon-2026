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
    if (!endEl || !boundaryRef.current) return;

    // IntersectionObserver を使用してブラウザネイティブ最適化
    const observer = new IntersectionObserver(([entry]) => {
      // contentEndRef が boundaryRef より下にある = contentEnd が visible ならfalse
      setHasContentBelow(!entry.isIntersecting);
    });

    observer.observe(endEl);

    return () => {
      observer.disconnect();
    };
  }, [contentEndRef, boundaryRef]);

  return hasContentBelow;
}

import { RefObject, useCallback, useEffect, useState } from "react";

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

  const check = useCallback(() => {
    const endEl = contentEndRef.current;
    const barEl = boundaryRef.current;
    if (endEl && barEl) {
      const endRect = endEl.getBoundingClientRect();
      const barRect = barEl.getBoundingClientRect();
      setHasContentBelow(endRect.top > barRect.top);
    }
  }, [contentEndRef, boundaryRef]);

  useEffect(() => {
    // 初回チェック
    check();

    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });

    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [check]);

  return hasContentBelow;
}

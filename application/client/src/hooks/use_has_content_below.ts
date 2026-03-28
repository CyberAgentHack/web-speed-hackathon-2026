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
    const contentEl = contentEndRef.current;
    const barEl = boundaryRef.current;
    if (!contentEl || !barEl) return;

    let io: IntersectionObserver | null = null;

    // boundaryRef の高さをもとに IntersectionObserver の rootMargin を設定する。
    // ResizeObserver コールバックはレイアウト計算後に呼ばれるため、
    // ここで getBoundingClientRect() を読んでも強制 reflow は発生しない。
    const createObserver = () => {
      io?.disconnect();
      const barHeight = barEl.getBoundingClientRect().height;
      io = new IntersectionObserver(
        ([entry]) => {
          setHasContentBelow(!entry!.isIntersecting);
        },
        { rootMargin: `0px 0px -${barHeight}px 0px`, threshold: 0 },
      );
      io.observe(contentEl);
    };

    createObserver();

    // boundaryRef のサイズが変わったら rootMargin を更新する
    const ro = new ResizeObserver(createObserver);
    ro.observe(barEl);

    return () => {
      io?.disconnect();
      ro.disconnect();
    };
  }, [contentEndRef, boundaryRef]);

  return hasContentBelow;
}

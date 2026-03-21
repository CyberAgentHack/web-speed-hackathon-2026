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
  const [hiddenViewportHeight, setHiddenViewportHeight] = useState(0);

  useEffect(() => {
    const boundaryElement = boundaryRef.current;
    if (boundaryElement === null) {
      return;
    }

    const updateHiddenViewportHeight = () => {
      const boundaryRect = boundaryElement.getBoundingClientRect();
      setHiddenViewportHeight(Math.max(0, Math.ceil(window.innerHeight - boundaryRect.top)));
    };

    updateHiddenViewportHeight();

    const resizeObserver = new ResizeObserver(updateHiddenViewportHeight);
    resizeObserver.observe(boundaryElement);
    window.addEventListener("resize", updateHiddenViewportHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateHiddenViewportHeight);
    };
  }, [boundaryRef]);

  useEffect(() => {
    const contentEndElement = contentEndRef.current;
    if (contentEndElement === null) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHasContentBelow(!(entry?.isIntersecting ?? true));
      },
      {
        root: null,
        rootMargin: `0px 0px -${hiddenViewportHeight}px 0px`,
        threshold: 0,
      },
    );

    observer.observe(contentEndElement);

    return () => {
      observer.disconnect();
    };
  }, [contentEndRef, hiddenViewportHeight]);

  return hasContentBelow;
}

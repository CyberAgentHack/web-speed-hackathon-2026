import { RefObject, useEffect, useState } from "react";

/**
 * contentEndRef の要素が画面内に見えているかを監視する。
 * IntersectionObserver を使って効率的に判定。
 */
export function useHasContentBelow(
  contentEndRef: RefObject<HTMLElement | null>,
  _boundaryRef: RefObject<HTMLElement | null>,
): boolean {
  const [hasContentBelow, setHasContentBelow] = useState(false);

  useEffect(() => {
    const endEl = contentEndRef.current;
    if (!endEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // contentEnd が画面外にある = コンテンツが下にある
        setHasContentBelow(!entry!.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(endEl);
    return () => observer.disconnect();
  }, [contentEndRef]);

  return hasContentBelow;
}

import { RefObject, useCallback, useEffect, useState } from "react";

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
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });

    // コンテンツ追加（SSEストリーミング等）でも再チェック
    const endEl = contentEndRef.current;
    let resizeObserver: ResizeObserver | undefined;
    if (endEl?.parentElement) {
      resizeObserver = new ResizeObserver(check);
      resizeObserver.observe(endEl.parentElement);
    }

    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      resizeObserver?.disconnect();
    };
  }, [check, contentEndRef]);

  return hasContentBelow;
}

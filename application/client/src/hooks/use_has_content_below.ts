import { RefObject, useEffect, useState } from "react";

export function useHasContentBelow(
  contentEndRef: RefObject<HTMLElement | null>,
  boundaryRef: RefObject<HTMLElement | null>,
): boolean {
  const [hasContentBelow, setHasContentBelow] = useState(false);

  useEffect(() => {
    const endEl = contentEndRef.current;
    const barEl = boundaryRef.current;
    if (!endEl || !barEl) return;

    const check = () => {
      const endRect = endEl.getBoundingClientRect();
      const barRect = barEl.getBoundingClientRect();
      setHasContentBelow(endRect.top > barRect.top);
    };

    const observer = new IntersectionObserver(check, {
      threshold: [0, 1],
    });
    observer.observe(endEl);

    const resizeObserver = new ResizeObserver(check);
    resizeObserver.observe(document.body);

    window.addEventListener("scroll", check, { passive: true });

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("scroll", check);
    };
  }, [contentEndRef, boundaryRef]);

  return hasContentBelow;
}

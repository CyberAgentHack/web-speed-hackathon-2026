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

    const height = barEl.getBoundingClientRect().height;

    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        const entry = entries[0];
        if (!entry) return;

        setHasContentBelow(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
        rootMargin: `0px 0px -${height}px 0px`,
      },
    );

    observer.observe(endEl);

    return () => {
      observer.disconnect();
    };
  }, [contentEndRef, boundaryRef]);

  return hasContentBelow;
}
import { RefObject, useEffect, useRef, useState } from "react";

interface Options {
  rootMargin?: string;
  threshold?: number;
}

export function useInViewOnce<T extends Element>({
  rootMargin = "0px",
  threshold = 0,
}: Options = {}): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    if (hasIntersected) {
      return;
    }

    const element = ref.current;
    if (element == null) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setHasIntersected(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setHasIntersected(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin,
        threshold,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasIntersected, rootMargin, threshold]);

  return [ref, hasIntersected];
}

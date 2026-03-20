import { RefCallback, useCallback, useEffect, useRef, useState } from "react";

interface UseInViewResult<T extends Element> {
  isInView: boolean;
  ref: RefCallback<T>;
}

export function useInView<T extends Element>(rootMargin = "200px"): UseInViewResult<T> {
  const [isInView, setIsInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback<RefCallback<T>>(
    (node) => {
      if (typeof IntersectionObserver === "undefined") {
        setIsInView(true);
        return;
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (node === null) {
        return;
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry && (entry.isIntersecting || entry.intersectionRatio > 0)) {
            setIsInView(true);
          }
        },
        { rootMargin, threshold: 0.01 },
      );
      observerRef.current.observe(node);
    },
    [rootMargin],
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  return { isInView, ref };
}

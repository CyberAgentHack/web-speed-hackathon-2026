import { RefCallback, useCallback, useEffect, useState } from "react";

export function useInViewOnce<T extends Element>(
  options?: IntersectionObserverInit,
): [RefCallback<T>, boolean] {
  const [target, setTarget] = useState<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  const ref = useCallback<RefCallback<T>>((element) => {
    setTarget(element);
  }, []);

  useEffect(() => {
    if (isInView || target === null) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setIsInView(true);
        observer.disconnect();
      }
    }, options);

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [isInView, options, target]);

  return [ref, isInView];
}

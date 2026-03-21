import { RefCallback, useCallback, useEffect, useMemo, useState } from "react";

interface Options {
  rootMargin?: string;
}

interface Result<T extends Element> {
  isNearViewport: boolean;
  targetRef: RefCallback<T>;
}

function isElementNearViewport(target: Element, rootMargin: string): boolean {
  const marginTop = Number.parseFloat(rootMargin.split(" ")[0] ?? "0");
  const rect = target.getBoundingClientRect();
  return rect.bottom >= -marginTop && rect.top <= window.innerHeight + marginTop;
}

export function useNearViewport<T extends Element>({
  rootMargin = "256px 0px",
}: Options = {}): Result<T> {
  const [target, setTarget] = useState<T | null>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const targetRef = useCallback<RefCallback<T>>((element) => {
    setTarget(element);
  }, []);

  const observerOptions = useMemo(() => ({ rootMargin }), [rootMargin]);

  useEffect(() => {
    if (isNearViewport) {
      return;
    }

    if (target == null) {
      return;
    }

    if (isElementNearViewport(target, rootMargin)) {
      setIsNearViewport(true);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setIsNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const isVisible = entries.some((entry) => entry.isIntersecting || entry.intersectionRatio > 0);
      if (!isVisible) {
        return;
      }
      setIsNearViewport(true);
      observer.disconnect();
    }, observerOptions);

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [isNearViewport, observerOptions, target]);

  return {
    isNearViewport,
    targetRef,
  };
}

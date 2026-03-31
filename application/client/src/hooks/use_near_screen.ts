import { useEffect, useRef, useState } from "react";

interface Options {
  rootMargin?: string;
}

/**
 * 要素がビューポート付近に入ったら true のまま維持します。
 */
export function useNearScreen<T extends Element>({ rootMargin = "0px" }: Options = {}) {
  const [isNearScreen, setIsNearScreen] = useState(false);
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (isNearScreen) {
      return;
    }

    const element = ref.current;
    if (element === null) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsNearScreen(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [isNearScreen, rootMargin]);

  return { isNearScreen, ref };
}

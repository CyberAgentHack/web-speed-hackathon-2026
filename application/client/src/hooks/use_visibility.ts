import { useEffect, useRef, useState } from "react";

interface Options {
  initialVisible?: boolean;
  once?: boolean;
  rootMargin?: string;
}

export function useVisibility<T extends Element>({
  initialVisible = false,
  once = false,
  rootMargin = "0px",
}: Options = {}) {
  const targetRef = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(initialVisible);

  useEffect(() => {
    const target = targetRef.current;

    if (target === null) {
      return;
    }

    if (once && isVisible) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry === undefined) {
          return;
        }

        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.disconnect();
          }
          return;
        }

        if (!once) {
          setIsVisible(false);
        }
      },
      { rootMargin },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [isVisible, once, rootMargin]);

  return { isVisible, targetRef };
}

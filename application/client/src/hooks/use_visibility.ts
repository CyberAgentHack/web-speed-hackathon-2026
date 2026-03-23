import { useEffect, useRef, useState } from "react";

interface Options {
  rootMargin?: string;
}

export function useVisibility({ rootMargin = "200px 0px" }: Options = {}) {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (element == null || isVisible) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
        }
      },
      { rootMargin },
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [isVisible, rootMargin]);

  return { isVisible, ref };
}

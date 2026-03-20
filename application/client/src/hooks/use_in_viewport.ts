import { useEffect, useRef, useState } from "react";

/**
 * IntersectionObserver でビューポート付近に入ったかを検知するフック。
 * 一度 true になったら disconnect する（ワンショット）。
 */
export function useInViewport(rootMargin = "0px"): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [isInViewport, setIsInViewport] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || isInViewport) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsInViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, isInViewport]);

  return [ref, isInViewport];
}

import { useCallback, useRef, useState } from "react";

export function useIntersectionObserver(
  options?: IntersectionObserverInit,
): [React.RefCallback<Element>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: Element | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (node === null || isIntersecting) return;
      observerRef.current = new IntersectionObserver(([entry]) => {
        if (entry?.isIntersecting) {
          setIsIntersecting(true);
          observerRef.current?.disconnect();
        }
      }, options);
      observerRef.current.observe(node);
    },
    [isIntersecting, options],
  );

  return [ref, isIntersecting];
}

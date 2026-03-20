import { RefObject, useEffect, useState } from "react";

/**
 * 要素がビューポートに入る（または rootMargin の範囲内に入る）と true を返す。
 * 一度 true になったら監視を停止し、以降は true を維持する。
 */
export function useIntersectionObserver(
  ref: RefObject<Element | null>,
  options?: IntersectionObserverInit,
): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry!.isIntersecting) {
          setIsVisible(true);
          io.disconnect();
        }
      },
      options,
    );
    io.observe(el);

    return () => io.disconnect();
  }, [ref, options]);

  return isVisible;
}

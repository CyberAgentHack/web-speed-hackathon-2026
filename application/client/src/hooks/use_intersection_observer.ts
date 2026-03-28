import { RefObject, useEffect, useRef, useState } from "react";

/**
 * 要素がビューポートに入る（または rootMargin の範囲内に入る）と true を返す。
 * 一度 true になったら監視を停止し、以降は true を維持する。
 */
export function useIntersectionObserver(
  ref: RefObject<Element | null>,
  options?: IntersectionObserverInit,
): boolean {
  const [isVisible, setIsVisible] = useState(false);
  // options はレンダーごとに新しいオブジェクトが渡されることがあるため ref で安定化させる
  const optionsRef = useRef(options);

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
      optionsRef.current,
    );
    io.observe(el);

    return () => io.disconnect();
  }, [ref]);

  return isVisible;
}

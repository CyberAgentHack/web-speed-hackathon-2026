import { useEffect, useLayoutEffect, useRef, useState } from "react";

const ROOT_MARGIN_PX = 800;

export const useActivateOnceVisible = <T extends Element>() => {
  const targetRef = useRef<T | null>(null);
  const [isActive, setIsActive] = useState(false);

  useLayoutEffect(() => {
    if (isActive || targetRef.current === null) {
      return;
    }

    const rect = targetRef.current.getBoundingClientRect();
    if (rect.top <= window.innerHeight + ROOT_MARGIN_PX && rect.bottom >= -ROOT_MARGIN_PX) {
      setIsActive(true);
    }
  }, [isActive]);

  useEffect(() => {
    if (isActive || targetRef.current === null) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsActive(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: `${ROOT_MARGIN_PX}px 0px`,
      },
    );

    observer.observe(targetRef.current);
    return () => {
      observer.disconnect();
    };
  }, [isActive]);

  return {
    isActive,
    targetRef,
  };
};

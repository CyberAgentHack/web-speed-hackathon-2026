import { useEffect, useRef } from "react";

type Timer = ReturnType<typeof setTimeout>;

export const useDebounceEffect = (
  effect: () => void | (() => void),
  delay: number,
  deps: unknown[],
) => {
  const timer = useRef<Timer | null>(null);

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(() => effect(), delay);

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [...deps, delay]);
};

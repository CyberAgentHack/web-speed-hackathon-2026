import { useCallback, useEffect, useRef } from "react";

export function useDebounce(fn: () => void, ms: number) {
  const debounced = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if(debounced.current) {
        clearTimeout(debounced.current);
      }
    }
  });

  return useCallback(() => {
    if(debounced.current !== null) {
      return;
    }

    debounced.current = setTimeout(() => {
      debounced.current = null;
    }, ms);
    fn();
  }, [fn]);
}

export function useDebounceAfter<const F extends (...rest: any[]) => void>(fn: F, ms: number): F {
  const debounced = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if(debounced.current) {
        clearTimeout(debounced.current);
      }
    }
  }, []);

  return useCallback((...args: Parameters<F>) => {
    const onWaitedEnough = () => {
      console.log("Timer fired:", args);
      fn(...args);
      debounced.current = null;
    }

    if(debounced.current) {
      clearTimeout(debounced.current);
    }
    debounced.current = setTimeout(onWaitedEnough, ms);
    console.log("Debouncing with", args);
  }, [fn]) as F;
}


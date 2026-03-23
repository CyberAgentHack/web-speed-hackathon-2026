import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, waitMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, waitMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [value, waitMs]);

  return debouncedValue;
}

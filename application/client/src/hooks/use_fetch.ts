import { useEffect, useState } from "react";

interface ReturnValues<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export function useFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T>,
  options?: { enabled?: boolean },
): ReturnValues<T> {
  const enabled = options?.enabled ?? true;

  const [result, setResult] = useState<ReturnValues<T>>({
    data: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    if (!enabled) return;

    setResult(() => ({
      data: null,
      error: null,
      isLoading: true,
    }));

    void fetcher(apiPath).then(
      (data) => {
        setResult((cur) => ({
          ...cur,
          data,
          isLoading: false,
        }));
      },
      (error) => {
        setResult((cur) => ({
          ...cur,
          error,
          isLoading: false,
        }));
      },
    );
  }, [apiPath, fetcher, enabled]);

  return enabled ? result : { data: null, error: null, isLoading: false };
}

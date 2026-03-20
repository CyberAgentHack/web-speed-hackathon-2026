import { useEffect, useState } from "react";

interface ReturnValues<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

declare global {
  interface Window {
    __PREFETCH_JSON__?: Record<string, Promise<unknown>>;
  }
}

function consumePrefetch<T>(apiPath: string): Promise<T> | null {
  const prefetched = window.__PREFETCH_JSON__?.[apiPath];
  if (prefetched == null) {
    return null;
  }

  delete window.__PREFETCH_JSON__?.[apiPath];
  return prefetched as Promise<T>;
}

export function useFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T>,
): ReturnValues<T> {
  const [result, setResult] = useState<ReturnValues<T>>({
    data: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    setResult(() => ({
      data: null,
      error: null,
      isLoading: true,
    }));

    const dataPromise = consumePrefetch<T>(apiPath) ?? fetcher(apiPath);

    void dataPromise.then(
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
  }, [apiPath, fetcher]);

  return result;
}

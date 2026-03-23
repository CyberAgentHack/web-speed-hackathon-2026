import { useEffect, useState } from "react";

interface ReturnValues<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

type PrefetchCache = Record<string, Promise<unknown>>;

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
    setResult({ data: null, error: null, isLoading: true });

    const cache = (window as unknown as { __q?: PrefetchCache }).__q;
    const prefetched = cache?.[apiPath] as Promise<T | null> | undefined;
    if (prefetched) {
      delete cache![apiPath];
      void prefetched.then(
        (data) => {
          if (data !== null) {
            setResult({ data, error: null, isLoading: false });
          } else {
            void fetcher(apiPath).then(
              (data) => setResult({ data, error: null, isLoading: false }),
              (error: Error) => setResult({ data: null, error, isLoading: false }),
            );
          }
        },
      );
      return;
    }

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
  }, [apiPath, fetcher]);

  return result;
}

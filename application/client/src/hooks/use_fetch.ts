import { useEffect, useState } from "react";

interface ReturnValues<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

interface Options {
  enabled?: boolean;
}

export function useFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T>,
  options: Options = {},
): ReturnValues<T> {
  const { enabled = true } = options;
  const [result, setResult] = useState<ReturnValues<T>>({
    data: null,
    error: null,
    isLoading: enabled,
  });

  useEffect(() => {
    if (!enabled) {
      setResult({
        data: null,
        error: null,
        isLoading: false,
      });
      return;
    }

    let cancelled = false;

    setResult(() => ({
      data: null,
      error: null,
      isLoading: true,
    }));

    void fetcher(apiPath).then(
      (data) => {
        if (cancelled) {
          return;
        }
        setResult((cur) => ({
          ...cur,
          data,
          isLoading: false,
        }));
      },
      (error) => {
        if (cancelled) {
          return;
        }
        setResult((cur) => ({
          ...cur,
          error,
          isLoading: false,
        }));
      },
    );

    return () => {
      cancelled = true;
    };
  }, [apiPath, enabled, fetcher]);

  return result;
}

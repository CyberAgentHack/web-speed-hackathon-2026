import { useEffect, useState } from "react";

import { FetchOptions, isAbortError } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface ReturnValues<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export function useFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string, options?: FetchOptions) => Promise<T>,
): ReturnValues<T> {
  const [result, setResult] = useState<ReturnValues<T>>({
    data: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    if (apiPath === "") {
      setResult({
        data: null,
        error: null,
        isLoading: false,
      });
      return;
    }

    const abortController = new AbortController();

    setResult(() => ({
      data: null,
      error: null,
      isLoading: true,
    }));

    void fetcher(apiPath, { signal: abortController.signal }).then(
      (data) => {
        setResult((cur) => ({
          ...cur,
          data,
          isLoading: false,
        }));
      },
      (error) => {
        if (isAbortError(error)) {
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
      abortController.abort();
    };
  }, [apiPath, fetcher]);

  return result;
}

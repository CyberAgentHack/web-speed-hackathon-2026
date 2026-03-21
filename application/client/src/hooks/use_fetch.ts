import { useEffect, useState } from "react";

import { consumePrefetchedJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface ReturnValues<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export function useFetch<T>(
  apiPath: string | null,
  fetcher: (apiPath: string) => Promise<T>,
): ReturnValues<T> {
  const [result, setResult] = useState<ReturnValues<T>>({
    data: null,
    error: null,
    isLoading: apiPath !== null,
  });

  useEffect(() => {
    if (apiPath === null) {
      return;
    }

    const prefetchedData = consumePrefetchedJSON<T>(apiPath);
    if (prefetchedData !== undefined) {
      setResult({
        data: prefetchedData,
        error: null,
        isLoading: false,
      });
      return;
    }

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
  }, [apiPath, fetcher]);

  return result;
}

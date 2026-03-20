import { useEffect, useState } from "react";

import { consumeBootstrapData } from "@web-speed-hackathon-2026/client/src/utils/bootstrap_data";

interface ReturnValues<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
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
    if (!apiPath) {
      setResult(() => ({
        data: null,
        error: null,
        isLoading: false,
      }));
      return;
    }

    setResult(() => ({
      data: null,
      error: null,
      isLoading: true,
    }));

    const bootstrapData = consumeBootstrapData<T>(apiPath);
    if (bootstrapData !== null) {
      setResult(() => ({
        data: bootstrapData,
        error: null,
        isLoading: false,
      }));
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

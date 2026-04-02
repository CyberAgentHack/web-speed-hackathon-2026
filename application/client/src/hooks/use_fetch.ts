import { useEffect, useState } from "react";

interface ReturnValues<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export function useFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T>,
  enabled = true,
): ReturnValues<T> {
  const [result, setResult] = useState<ReturnValues<T>>({
    data: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    if (!enabled || apiPath === "") {
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

  return result;
}

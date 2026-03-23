import { useEffect, useState } from "react";

interface ReturnValues<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export function useFetch<T>(
  apiPath: string | null | undefined,
  fetcher: (apiPath: string) => Promise<T>,
  initialData?: T,
): ReturnValues<T> {
  const [result, setResult] = useState<ReturnValues<T>>({
    data: initialData ?? null,
    error: null,
    isLoading: initialData == null,
  });

  useEffect(() => {
    if (initialData != null) return;
    if (!apiPath) {
      setResult({ data: null, error: null, isLoading: false });
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
  }, [apiPath, fetcher, initialData]);

  return result;
}

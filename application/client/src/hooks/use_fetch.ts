import { useEffect, useState } from "react";

interface ReturnValues<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export function useFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T>,
  initialData?: T | null,
): ReturnValues<T> {
  const hasInitial = initialData != null;
  const [result, setResult] = useState<ReturnValues<T>>({
    data: initialData ?? null,
    error: null,
    isLoading: !hasInitial,
  });

  useEffect(() => {
    if (hasInitial) return;

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
  }, [apiPath, fetcher, hasInitial]);

  return result;
}

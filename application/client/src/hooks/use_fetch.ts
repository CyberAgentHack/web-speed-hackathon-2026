import { useEffect, useState } from "react";

interface ReturnValues<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

interface Options<T> {
  initialData?: T | null;
}

export function useFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T>,
  options?: Options<T>,
): ReturnValues<T> {
  const hasInitialData = options?.initialData !== undefined;
  const [result, setResult] = useState<ReturnValues<T>>({
    data: options?.initialData ?? null,
    error: null,
    isLoading: !hasInitialData,
  });

  useEffect(() => {
    if (hasInitialData) {
      setResult(() => ({
        data: options?.initialData ?? null,
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
  }, [apiPath, fetcher, hasInitialData, options?.initialData]);

  return result;
}

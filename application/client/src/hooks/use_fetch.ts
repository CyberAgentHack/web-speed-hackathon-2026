import { useEffect, useState } from "react";

interface ReturnValues<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

interface Options<T> {
  initialData?: T;
}

export function useFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T>,
  options: Options<T> = {},
): ReturnValues<T> {
  const hasInitialData = options.initialData !== undefined;
  const initialData = options.initialData ?? null;
  const [result, setResult] = useState<ReturnValues<T>>({
    data: initialData,
    error: null,
    isLoading: apiPath !== "" && !hasInitialData,
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

    if (hasInitialData) {
      setResult({
        data: initialData,
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
  }, [apiPath, fetcher, hasInitialData, initialData]);

  return result;
}

import { useEffect, useRef, useState } from "react";

interface ReturnValues<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export function useFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T>,
  initialData?: T,
): ReturnValues<T> {
  const hasInitialData = initialData !== undefined;
  const [result, setResult] = useState<ReturnValues<T>>({
    data: hasInitialData ? initialData : null,
    error: null,
    isLoading: !hasInitialData,
  });

  const initialDataUsedRef = useRef(hasInitialData);

  useEffect(() => {
    if (initialDataUsedRef.current) {
      initialDataUsedRef.current = false;
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

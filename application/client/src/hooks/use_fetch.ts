import { useEffect, useRef, useState } from "react";

interface ReturnValues<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

function consumeInitialData<T>(cacheKey: string): T | null {
  const store = (window as unknown as { __INITIAL_DATA__?: Record<string, unknown> })
    .__INITIAL_DATA__;
  if (store && cacheKey in store) {
    const data = store[cacheKey] as T;
    delete store[cacheKey];
    return data;
  }
  return null;
}

export function useFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T>,
): ReturnValues<T> {
  const usedInitialDataRef = useRef(false);

  const [result, setResult] = useState<ReturnValues<T>>(() => {
    const cached = consumeInitialData<T>(apiPath);
    if (cached != null) {
      usedInitialDataRef.current = true;
      return { data: cached, error: null, isLoading: false };
    }
    return { data: null, error: null, isLoading: true };
  });

  useEffect(() => {
    if (usedInitialDataRef.current) {
      usedInitialDataRef.current = false;
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

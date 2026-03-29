import { useEffect, useState } from "react";

declare global {
  interface Window {
    __PRELOADED_POST__?: unknown;
  }
}

interface ReturnValues<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

function consumePreloadedData<T>(apiPath: string): T | null {
  if (
    apiPath.startsWith("/api/v1/posts/") &&
    !apiPath.endsWith("/comments") &&
    window.__PRELOADED_POST__ != null
  ) {
    const data = window.__PRELOADED_POST__ as T;
    delete window.__PRELOADED_POST__;
    return data;
  }
  return null;
}

export function useFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T>,
): ReturnValues<T> {
  const [result, setResult] = useState<ReturnValues<T>>(() => {
    const preloaded = consumePreloadedData<T>(apiPath);
    if (preloaded != null) {
      return {
        data: preloaded,
        error: null,
        isLoading: false,
      };
    }
    return {
      data: null,
      error: null,
      isLoading: true,
    };
  });

  useEffect(() => {
    const preloaded = consumePreloadedData<T>(apiPath);
    if (preloaded != null) {
      setResult({
        data: preloaded,
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

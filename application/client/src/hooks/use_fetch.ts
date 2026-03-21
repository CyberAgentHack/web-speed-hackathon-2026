import { useEffect, useRef, useState } from "react";

interface ReturnValues<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

declare global {
  interface Window {
    __PREFETCH_JSON__?: Record<string, unknown>;
  }
}

type PrefetchState<T> = {
  data: T | null;
  promise: Promise<T> | null;
};

function hasPrefetchEnvelope<T>(value: unknown): value is { data: T; promise?: Promise<T> } {
  return typeof value === "object" && value !== null && "data" in value;
}

function consumePrefetch<T>(apiPath: string): PrefetchState<T> {
  const prefetched = window.__PREFETCH_JSON__?.[apiPath];
  if (prefetched == null) {
    return { data: null, promise: null };
  }

  delete window.__PREFETCH_JSON__?.[apiPath];
  if (prefetched instanceof Promise) {
    return { data: null, promise: prefetched as Promise<T> };
  }

  if (hasPrefetchEnvelope<T>(prefetched)) {
    return {
      data: prefetched.data,
      promise: prefetched.promise ?? null,
    };
  }

  return { data: prefetched as T, promise: null };
}

export function useFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T>,
): ReturnValues<T> {
  const bootstrapRef = useRef<{ apiPath: string; prefetched: PrefetchState<T> } | null>(null);
  if (bootstrapRef.current?.apiPath !== apiPath) {
    bootstrapRef.current = {
      apiPath,
      prefetched: consumePrefetch<T>(apiPath),
    };
  }

  const [result, setResult] = useState<ReturnValues<T>>(() => {
    const prefetched = bootstrapRef.current?.prefetched ?? { data: null, promise: null };
    if (prefetched.data !== null) {
      return {
        data: prefetched.data,
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
    const prefetched =
      bootstrapRef.current?.apiPath === apiPath
        ? bootstrapRef.current.prefetched
        : consumePrefetch<T>(apiPath);
    bootstrapRef.current = null;
    const dataPromise = prefetched.promise ?? (prefetched.data === null ? fetcher(apiPath) : null);

    setResult(() => ({
      data: prefetched.data,
      error: null,
      isLoading: dataPromise !== null && prefetched.data === null,
    }));

    if (dataPromise === null) {
      return;
    }

    void dataPromise.then(
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

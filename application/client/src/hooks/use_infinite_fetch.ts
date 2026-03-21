import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 10;

function buildPagedUrl(apiPath: string, limit: number, offset: number): string {
  const separator = apiPath.includes("?") ? "&" : "?";
  return `${apiPath}${separator}limit=${String(limit)}&offset=${String(offset)}`;
}

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

declare global {
  var __SSG_INITIAL_DATA__: { apiPath: string; data: unknown[] } | undefined;
}

function consumeInitialData<T>(apiPath: string): T[] | null {
  if (typeof globalThis.__SSG_INITIAL_DATA__ !== "undefined") {
    const ssgData = globalThis.__SSG_INITIAL_DATA__;
    if (ssgData.apiPath === apiPath) {
      globalThis.__SSG_INITIAL_DATA__ = undefined;
      return ssgData.data as T[];
    }
  }
  if (typeof document === "undefined") return null;
  const el = document.getElementById("__INITIAL_DATA__");
  if (el === null) return null;
  try {
    const parsed = JSON.parse(el.textContent ?? "") as Record<string, unknown>;
    if (parsed["apiPath"] !== apiPath) return null;
    el.remove();
    return parsed["data"] as T[];
  } catch {
    return null;
  }
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
): ReturnValues<T> {
  const initialData = useRef(consumeInitialData<T>(apiPath));
  const internalRef = useRef({
    isLoading: false,
    offset: initialData.current !== null ? initialData.current.length : 0,
    hasMore: initialData.current !== null ? initialData.current.length >= LIMIT : true,
  });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: initialData.current ?? [],
    error: null,
    isLoading: initialData.current === null,
  });

  const fetchMore = useCallback(() => {
    const { isLoading, offset, hasMore } = internalRef.current;
    if (isLoading || !hasMore) {
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      isLoading: true,
      offset,
      hasMore,
    };

    const pagedUrl = buildPagedUrl(apiPath, LIMIT, offset);

    void fetcher(pagedUrl).then(
      (pageData) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pageData],
          isLoading: false,
        }));
        internalRef.current = {
          isLoading: false,
          offset: offset + LIMIT,
          hasMore: pageData.length >= LIMIT,
        };
      },
      (error) => {
        setResult((cur) => ({
          ...cur,
          error,
          isLoading: false,
        }));
        internalRef.current = {
          isLoading: false,
          offset,
          hasMore,
        };
      },
    );
  }, [apiPath, fetcher]);

  const didUseInitialData = useRef(initialData.current !== null);

  useEffect(() => {
    if (didUseInitialData.current) {
      didUseInitialData.current = false;
      return;
    }
    setResult(() => ({
      data: [],
      error: null,
      isLoading: true,
    }));
    internalRef.current = {
      isLoading: false,
      offset: 0,
      hasMore: true,
    };

    fetchMore();
  }, [fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}

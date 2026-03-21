import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_LIMIT = 30;

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

interface Options {
  pageSize?: number;
  serverPagination?: boolean;
  prefetchKey?: string;
}

declare global {
  interface Window {
    __HOME_TIMELINE_PREFETCH__?: unknown[];
    __PREFETCH_TIMELINE__?: Promise<unknown[]>;
  }
}

type PrefetchState<T> = {
  items: T[] | null;
  promise: Promise<T[]> | null;
};

function ensureArrayResponse<T>(apiPath: string, value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  console.error("[debug][useInfiniteFetch] expected array response", {
    apiPath,
    value,
  });
  throw new Error(`Expected array response from ${apiPath}`);
}

function takePrefetch<T>(key?: string): PrefetchState<T> {
  if (key !== "__PREFETCH_TIMELINE__") {
    return { items: null, promise: null };
  }

  if (Array.isArray(window.__HOME_TIMELINE_PREFETCH__)) {
    const items = window.__HOME_TIMELINE_PREFETCH__ as T[];
    window.__HOME_TIMELINE_PREFETCH__ = undefined;
    window.__PREFETCH_TIMELINE__ = undefined;
    return { items, promise: null };
  }

  if (window.__PREFETCH_TIMELINE__) {
    const promise = (window.__PREFETCH_TIMELINE__ as Promise<unknown>).then((value) =>
      ensureArrayResponse<T>(key, value),
    );
    window.__PREFETCH_TIMELINE__ = undefined;
    return { items: null, promise };
  }

  return { items: null, promise: null };
}

function createBootstrap<T>(apiPath: string, pageSize: number, prefetchKey?: string) {
  if (apiPath === "") {
    return {
      prefetchedPromise: null as Promise<T[]> | null,
      result: {
        data: [] as T[],
        error: null,
        isLoading: false,
      },
      state: {
        hasReachedEnd: true,
        isLoading: false,
        offset: 0,
      },
    };
  }

  const prefetched = takePrefetch<T>(prefetchKey);
  const initialItems = prefetched.items ?? [];
  const shouldLoad = prefetched.promise != null || prefetched.items == null;

  return {
    prefetchedPromise: prefetched.promise,
    result: {
      data: initialItems,
      error: null,
      isLoading: shouldLoad,
    },
    state: {
      hasReachedEnd: prefetched.items != null && initialItems.length < pageSize,
      isLoading: false,
      offset: initialItems.length,
    },
  };
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
  options?: Options,
): ReturnValues<T> {
  const pageSize = options?.pageSize ?? DEFAULT_LIMIT;
  const serverPagination = options?.serverPagination === true;
  const prefetchKey = options?.prefetchKey;
  const initialBootstrapRef = useRef(createBootstrap<T>(apiPath, pageSize, prefetchKey));
  const hasInitializedRef = useRef(false);
  const pendingPrefetchRef = useRef(initialBootstrapRef.current.prefetchedPromise);
  const internalRef = useRef(initialBootstrapRef.current.state);

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>(
    initialBootstrapRef.current.result,
  );

  const fetchMore = useCallback(() => {
    const { hasReachedEnd, isLoading, offset } = internalRef.current;
    if (apiPath === "" || isLoading || hasReachedEnd) {
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      hasReachedEnd,
      isLoading: true,
      offset,
    };

    const prefetched = offset === 0 ? pendingPrefetchRef.current : null;
    pendingPrefetchRef.current = null;
    const dataPromise = prefetched ?? (() => {
      const requestPath = serverPagination
        ? `${apiPath}${apiPath.includes("?") ? "&" : "?"}limit=${pageSize}&offset=${offset}`
        : apiPath;
      return fetcher(requestPath);
    })();

    void dataPromise.then(
      (items) => {
        const safeItems = ensureArrayResponse<T>(apiPath, items);
        const nextItems = serverPagination
          ? safeItems
          : safeItems.slice(offset, offset + pageSize);
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...nextItems],
          error: null,
          isLoading: false,
        }));
        internalRef.current = {
          hasReachedEnd: nextItems.length < pageSize,
          isLoading: false,
          offset: offset + nextItems.length,
        };
      },
      (error) => {
        setResult((cur) => ({
          ...cur,
          error,
          isLoading: false,
        }));
        internalRef.current = {
          hasReachedEnd,
          isLoading: false,
          offset,
        };
      },
    );
  }, [apiPath, fetcher, pageSize, prefetchKey]);

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      return;
    }

    const bootstrap = createBootstrap<T>(apiPath, pageSize, prefetchKey);
    pendingPrefetchRef.current = bootstrap.prefetchedPromise;
    internalRef.current = bootstrap.state;
    setResult(bootstrap.result);
  }, [apiPath, pageSize, prefetchKey]);

  useEffect(() => {
    if (apiPath === "") {
      return;
    }

    if (result.data.length > 0 && pendingPrefetchRef.current == null) {
      return;
    }

    fetchMore();
  }, [apiPath, fetchMore, result.data.length]);

  return {
    ...result,
    fetchMore,
  };
}

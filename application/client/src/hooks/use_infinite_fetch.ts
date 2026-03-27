import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const LIMIT = 30;

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
): ReturnValues<T> {
  const isEnabled = apiPath.trim() !== "";
  const preloaded = useMemo(() => {
    if (typeof window === "undefined") return { found: false as const, value: [] as T[] };
    if (!isEnabled) return { found: false as const, value: [] as T[] };
    const preload = (window as unknown as { __PRELOAD_DATA__?: Record<string, unknown> }).__PRELOAD_DATA__;
    if (!preload) return { found: false as const, value: [] as T[] };
    if (!(apiPath in preload)) return { found: false as const, value: [] as T[] };
    const value = preload[apiPath];
    if (!Array.isArray(value)) return { found: false as const, value: [] as T[] };
    return { found: true as const, value: value as T[] };
  }, [apiPath, isEnabled]);

  const internalRef = useRef({ isLoading: false, offset: preloaded.found ? preloaded.value.length : 0 });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>(() => ({
    data: preloaded.found ? preloaded.value : [],
    error: null,
    isLoading: !preloaded.found,
  }));

  const fetchMore = useCallback(() => {
    if (!isEnabled) {
      return;
    }
    const { isLoading, offset } = internalRef.current;
    if (isLoading) {
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      isLoading: true,
      offset,
    };

    void fetcher(apiPath).then(
      (allData) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...allData.slice(offset, offset + LIMIT)],
          isLoading: false,
        }));
        internalRef.current = {
          isLoading: false,
          offset: offset + LIMIT,
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
        };
      },
    );
  }, [apiPath, fetcher, isEnabled]);

  useEffect(() => {
    if (!isEnabled) {
      internalRef.current = { isLoading: false, offset: 0 };
      setResult(() => ({
        data: [],
        error: null,
        isLoading: false,
      }));
      return;
    }
    if (preloaded.found) {
      // プリロード値を使い切ったので、以後の fetchMore はネットワーク取得に切り替える
      if (typeof window !== "undefined") {
        const preload = (window as unknown as { __PRELOAD_DATA__?: Record<string, unknown> }).__PRELOAD_DATA__;
        if (preload && apiPath in preload) delete preload[apiPath];
      }
      internalRef.current = { isLoading: false, offset: preloaded.value.length };
      setResult(() => ({
        data: preloaded.value,
        error: null,
        isLoading: false,
      }));
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
    };

    fetchMore();
  }, [fetchMore, apiPath, preloaded.found, preloaded.value.length]);

  return {
    ...result,
    fetchMore,
  };
}

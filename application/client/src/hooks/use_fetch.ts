import { useEffect, useMemo, useState } from "react";

interface ReturnValues<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export function useFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T>,
): ReturnValues<T> {
  const preloaded = useMemo(() => {
    if (typeof window === "undefined") return { found: false as const, value: null as T | null };
    const preload = (window as unknown as { __PRELOAD_DATA__?: Record<string, unknown> }).__PRELOAD_DATA__;
    if (!preload) return { found: false as const, value: null as T | null };
    if (!(apiPath in preload)) return { found: false as const, value: null as T | null };
    return { found: true as const, value: preload[apiPath] as T | null };
  }, [apiPath]);

  const [result, setResult] = useState<ReturnValues<T>>(() => ({
    data: preloaded.found ? preloaded.value : null,
    error: null,
    isLoading: !preloaded.found,
  }));

  useEffect(() => {
    // 以後の API 呼び出しで同じプリロード値を使い回さない
    if (preloaded.found) {
      if (typeof window !== "undefined") {
        const preload = (window as unknown as { __PRELOAD_DATA__?: Record<string, unknown> }).__PRELOAD_DATA__;
        if (preload && apiPath in preload) delete preload[apiPath];
      }
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
  }, [apiPath, fetcher, preloaded.found]);

  return result;
}

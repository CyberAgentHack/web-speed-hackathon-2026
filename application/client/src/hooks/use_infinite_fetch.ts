import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 30;

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

// SSR プリフェッチデータを取得し、一度だけ消費する
function consumeSSRData<T>(apiPath: string): T[] {
  try {
    const store =
      typeof window !== "undefined"
        ? (window as any).__SSR_DATA__ // クライアント（ハイドレーション時）
        : (globalThis as any).__SSR_DATA__; // サーバー（SSR レンダリング時）
    const match = store?.[apiPath];
    if (!Array.isArray(match)) return [];
    // クライアント側は一度だけ使用（2回目以降のマウントで使い回さない）
    if (typeof window !== "undefined") {
      delete store[apiPath];
    }
    return match as T[];
  } catch {
    return [];
  }
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
): ReturnValues<T> {
  // コンポーネントマウント時に SSR データを一度だけ読む
  const ssrInitialData = useRef<T[]>(consumeSSRData<T>(apiPath));
  const internalRef = useRef({ isLoading: false, offset: 0 });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>(() => {
    const initial = ssrInitialData.current;
    return {
      data: initial,
      error: null,
      isLoading: initial.length === 0,
    };
  });

  const fetchMore = useCallback(() => {
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

    // サーバーサイドページネーション: limit/offset をクエリパラメータで渡す
    const sep = apiPath.includes("?") ? "&" : "?";
    void fetcher(`${apiPath}${sep}limit=${LIMIT}&offset=${offset}`).then(
      (pageData) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pageData],
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
  }, [apiPath, fetcher]);

  useEffect(() => {
    const initial = ssrInitialData.current;
    if (initial.length > 0) {
      // SSR データがある場合: 初期フェッチをスキップし、続きの offset をセット
      internalRef.current = { isLoading: false, offset: initial.length };
      ssrInitialData.current = []; // 次回マウント時（ナビゲーション後）はスキップしない
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
  }, [fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}

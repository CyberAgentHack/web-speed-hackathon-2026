import { useCallback, useEffect, useRef, useState } from "react";

// 初期ロード件数を削減してDOM構築コストを抑え、TBTを改善する
const LIMIT = 10;

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

/**
 * 無限スクロール用のデータ取得フック。
 * prefetchedDataを渡すとAPIレスポンス待ちを短縮できる（index.htmlの先行fetchと連携）。
 */
export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
  prefetchedData?: Promise<T[] | null> | null,
): ReturnValues<T> {
  const internalRef = useRef({ isLoading: false, offset: 0 });
  // 先行fetchは初回のみ使用し、以降は通常fetchに切り替える
  const prefetchRef = useRef(prefetchedData ?? null);

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: true,
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

    // 先行fetchの結果があれば初回のみ使用する
    let dataPromise: Promise<T[]>;
    const prefetched = prefetchRef.current;
    if (prefetched != null) {
      prefetchRef.current = null;
      dataPromise = prefetched.then((data) => data ?? fetcher(apiPath));
    } else {
      dataPromise = fetcher(apiPath);
    }

    void dataPromise.then(
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
  }, [apiPath, fetcher]);

  useEffect(() => {
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
